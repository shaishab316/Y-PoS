import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DateRangeQueryDto } from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getTzOffsetSuffix(timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset',
      });
      const parts = formatter.formatToParts(new Date());
      const offsetPart = parts.find((p) => p.type === 'timeZoneName');
      if (offsetPart) {
        const val = offsetPart.value;
        const match = val.match(/GMT([+-]\d+)(?::(\d+))?/);
        if (match) {
          const sign = match[1][0];
          const hours = match[1].slice(1).padStart(2, '0');
          const mins = (match[2] || '00').padStart(2, '0');
          return `${sign}${hours}:${mins}`;
        }
      }
    } catch (e) {
      // Fallback
    }
    return '+07:00';
  }

  private parseDateAsLocal(
    dateStr: string,
    isEnd: boolean,
    timezone: string,
  ): Date {
    let offset = '+07:00';
    if (timezone === 'UTC') {
      offset = 'Z';
    } else if (timezone.startsWith('+') || timezone.startsWith('-')) {
      offset = timezone;
    } else {
      offset = this.getTzOffsetSuffix(timezone);
    }

    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }

    const timeStr = isEnd ? '23:59:59.999' : '00:00:00.000';
    return new Date(`${dateStr}T${timeStr}${offset}`);
  }

  private getDateRange(query: DateRangeQueryDto) {
    const timezone = 'Asia/Bangkok';
    let startDate = new Date();
    let endDate = new Date();

    if (query.startDate) {
      startDate = this.parseDateAsLocal(query.startDate, false, timezone);
    } else {
      // Default: last 7 days
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const todayStr = formatter.format(new Date());
      const offsetSuffix = this.getTzOffsetSuffix(timezone);
      const todayLocal = new Date(`${todayStr}T00:00:00.000${offsetSuffix}`);

      startDate = new Date(todayLocal);
      startDate.setDate(startDate.getDate() - 7);
    }

    if (query.endDate) {
      endDate = this.parseDateAsLocal(query.endDate, true, timezone);
    } else {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const todayStr = formatter.format(new Date());
      const offsetSuffix = this.getTzOffsetSuffix(timezone);
      endDate = new Date(`${todayStr}T23:59:59.999${offsetSuffix}`);
    }

    return { startDate, endDate };
  }

  async getTopSellingItems(query: DateRangeQueryDto, limit: number = 10) {
    const { startDate, endDate } = this.getDateRange(query);

    const topItems = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        totalSold: number;
        totalRevenue: string;
      }>
    >`
      SELECT 
        i.id,
        i.name,
        SUM(oi.quantity) as "totalSold",
        SUM(oi.quantity * oi."unitPrice") as "totalRevenue"
      FROM order_items oi
      JOIN items i ON oi."itemId" = i.id
      JOIN orders o ON oi."orderId" = o.id
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != ${'CANCELLED'}
        AND oi."isCancelled" = false
      GROUP BY i.id, i.name
      ORDER BY "totalSold" DESC
      LIMIT ${limit}
    `;

    return topItems.map((item) => ({
      id: item.id,
      name: item.name,
      totalSold: Number(item.totalSold),
      totalRevenue: parseFloat(item.totalRevenue),
    }));
  }

  async getDashboardOverview(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // Get current period metrics
    const currentMetrics = await this.prisma.$queryRaw<
      Array<{ totalRevenue: string; totalOrders: number }>
    >`
      SELECT 
        SUM(CAST(p."totalAmount" AS DECIMAL(10,2))) as "totalRevenue",
        COUNT(DISTINCT o.id) as "totalOrders"
      FROM payments p
      JOIN orders o ON p."orderId" = o.id
      WHERE 
        p."paidAt" >= ${startDate}
        AND p."paidAt" <= ${endDate}
        AND p.status = ${'PAID'}
    `;

    const current = currentMetrics[0];
    const totalRevenue = parseFloat(current.totalRevenue) || 0;
    const totalOrders = Number(current.totalOrders) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period metrics for comparison
    const periodDiff = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDiff);
    const prevEndDate = new Date(startDate);

    const prevMetrics = await this.prisma.$queryRaw<
      Array<{ totalRevenue: string }>
    >`
      SELECT 
        SUM(CAST(p."totalAmount" AS DECIMAL(10,2))) as "totalRevenue"
      FROM payments p
      JOIN orders o ON p."orderId" = o.id
      WHERE 
        p."paidAt" >= ${prevStartDate}
        AND p."paidAt" <= ${prevEndDate}
        AND p.status = ${'PAID'}
    `;

    const prevRevenue = parseFloat(prevMetrics[0]?.totalRevenue) || 0;
    const percentageChange =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      percentageChange: percentageChange.toFixed(2),
    };
  }

  async getOrderTypeBreakdown(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const breakdown = await this.prisma.$queryRaw<
      Array<{ type: string; count: number }>
    >`
      SELECT 
        COALESCE(o.type, 'DINE_IN') as type,
        COUNT(*) as count
      FROM orders o
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != ${'CANCELLED'}
      GROUP BY o.type
    `;

    const totalOrders = breakdown.reduce(
      (sum, item) => sum + Number(item.count),
      0,
    );

    return breakdown.map((item) => ({
      type: item.type === 'DINE_IN' ? 'Dine-in' : 'Takeaway',
      count: Number(item.count),
      percentage:
        totalOrders > 0 ? (Number(item.count) / totalOrders) * 100 : 0,
    }));
  }

  async getSalesOverTime(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const timezone = 'Asia/Bangkok';

    const salesData = await this.prisma.$queryRaw<
      Array<{ date: Date; revenue: string; orders: number }>
    >`
      SELECT 
        CAST(o."createdAt" AT TIME ZONE ${timezone} as DATE) as date,
        SUM(CAST(p."totalAmount" AS DECIMAL(10,2))) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM payments p
      JOIN orders o ON p."orderId" = o.id
      WHERE 
        p."paidAt" >= ${startDate}
        AND p."paidAt" <= ${endDate}
        AND p.status = ${'PAID'}
      GROUP BY CAST(o."createdAt" AT TIME ZONE ${timezone} as DATE)
      ORDER BY date ASC
    `;

    return salesData.map((item) => ({
      date: new Date(item.date).toISOString().split('T')[0],
      revenue: parseFloat(item.revenue),
      orders: Number(item.orders),
    }));
  }

  async getOrdersPerHour(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const timezone = 'Asia/Bangkok';

    const hoursData = await this.prisma.$queryRaw<
      Array<{ hour: number | string | object; count: number }>
    >`
      SELECT 
        CAST(EXTRACT(HOUR FROM o."createdAt" AT TIME ZONE ${timezone}) AS INTEGER) as hour,
        COUNT(*) as count
      FROM orders o
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != ${'CANCELLED'}
      GROUP BY EXTRACT(HOUR FROM o."createdAt" AT TIME ZONE ${timezone})
      ORDER BY hour ASC
    `;

    // Fill in missing hours with 0
    const result: any[] = [];
    for (let h = 0; h < 24; h++) {
      const hourData = hoursData.find((d) => Number(d.hour) === h);
      result.push({
        hour: h,
        count: hourData ? Number(hourData.count) : 0,
      });
    }

    return result;
  }

  async getCompleteSalesMetrics(query: DateRangeQueryDto) {
    const [topItems, overview, typeBreakdown, salesOverTime, ordersPerHour] =
      await Promise.all([
        this.getTopSellingItems(query),
        this.getDashboardOverview(query),
        this.getOrderTypeBreakdown(query),
        this.getSalesOverTime(query),
        this.getOrdersPerHour(query),
      ]);

    return {
      topSellingItems: topItems,
      overview,
      orderTypeBreakdown: typeBreakdown,
      salesOverTime,
      ordersPerHour,
    };
  }

  async getSalesReport(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // Get sales summary
    const salesSummary = await this.getSalesOverTime(query);

    // Get top selling items
    const topSellingItems = await this.prisma.$queryRaw<
      Array<{
        itemName: string;
        category: string;
        quantity: number;
        revenue: string;
      }>
    >`
      SELECT 
        oi."itemName",
        COALESCE(i."itemType", 'INDIVIDUAL') as category,
        SUM(oi.quantity) as quantity,
        SUM(oi.quantity * oi."unitPrice") as revenue
      FROM order_items oi
      LEFT JOIN items i ON oi."itemId" = i.id
      JOIN orders o ON oi."orderId" = o.id
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != ${'CANCELLED'}
        AND oi."isCancelled" = false
      GROUP BY oi."itemName", i."itemType"
      ORDER BY quantity DESC
      LIMIT 10
    `;

    // Get order breakdown
    const orderBreakdown = await this.prisma.$queryRaw<
      Array<{ type: string; count: number }>
    >`
      SELECT 
        COALESCE(o.type, 'DINE_IN') as type,
        COUNT(*) as count
      FROM orders o
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != ${'CANCELLED'}
      GROUP BY o.type
    `;

    const totalOrderCount = orderBreakdown.reduce(
      (sum, item) => sum + Number(item.count),
      0,
    );
    const dineInCount = Number(
      orderBreakdown.find((o) => o.type === 'DINE_IN')?.count || 0,
    );
    const takeawayCount = Number(
      orderBreakdown.find((o) => o.type === 'TAKEAWAY')?.count || 0,
    );

    // Get monthly earnings (current month vs previous)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const prevMonthStart = new Date(currentMonthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const prevMonthEnd = new Date(currentMonthStart);
    prevMonthEnd.setDate(0);
    prevMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthEarnings = await this.prisma.$queryRaw<
      Array<{ revenue: string }>
    >`
      SELECT SUM(CAST(p."totalAmount" AS DECIMAL(10,2))) as revenue
      FROM payments p
      JOIN orders o ON p."orderId" = o.id
      WHERE 
        p."paidAt" >= ${currentMonthStart}
        AND p."paidAt" <= ${currentMonthEnd}
        AND p.status = ${'PAID'}
    `;

    const prevMonthEarnings = await this.prisma.$queryRaw<
      Array<{ revenue: string }>
    >`
      SELECT SUM(CAST(p."totalAmount" AS DECIMAL(10,2))) as revenue
      FROM payments p
      JOIN orders o ON p."orderId" = o.id
      WHERE 
        p."paidAt" >= ${prevMonthStart}
        AND p."paidAt" <= ${prevMonthEnd}
        AND p.status = ${'PAID'}
    `;

    const currentRevenue = parseFloat(currentMonthEarnings[0]?.revenue) || 0;
    const prevRevenue = parseFloat(prevMonthEarnings[0]?.revenue) || 0;
    const percentageChange =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    // Get production performance (average order processing time)
    const productionPerformance = await this.prisma.$queryRaw<
      Array<{
        itemName: string;
        avgTime: number;
      }>
    >`
      SELECT 
        oi."itemName",
        ROUND(AVG(EXTRACT(EPOCH FROM (oi."readyAt" - oi."processedAt"))) / 60)::integer as "avgTime"
      FROM order_items oi
      JOIN orders o ON oi."orderId" = o.id
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND oi."readyAt" IS NOT NULL
        AND oi."processedAt" IS NOT NULL
      GROUP BY oi."itemName"
      ORDER BY "avgTime" DESC
      LIMIT 10
    `;

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      salesSummary,
      monthlyEarnings: {
        currentMonth: currentRevenue,
        previousMonth: prevRevenue,
        percentageChange,
        comparisonText: `+${percentageChange.toFixed(1)}%`,
      },
      topSellingItems: topSellingItems.map((item) => ({
        item: item.itemName,
        category: item.category,
        quantity: Number(item.quantity),
        revenue: parseFloat(item.revenue),
      })),
      orderBreakdown: {
        dineIn: dineInCount,
        takeaway: takeawayCount,
        dineInPercentage:
          totalOrderCount > 0 ? (dineInCount / totalOrderCount) * 100 : 0,
        takeawayPercentage:
          totalOrderCount > 0 ? (takeawayCount / totalOrderCount) * 100 : 0,
      },
      productionPerformance: productionPerformance.map((item) => ({
        itemName: item.itemName,
        avgPrepTime: Number(item.avgTime),
      })),
    };
  }
}
