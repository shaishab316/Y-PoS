import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DateRangeQueryDto } from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(query: DateRangeQueryDto) {
    let startDate = new Date();
    let endDate = new Date();

    if (query.startDate) {
      startDate = new Date(query.startDate);
    } else {
      // Default: last 7 days
      startDate.setDate(startDate.getDate() - 7);
    }

    if (query.endDate) {
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
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
      percentageChange,
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

    const totalOrders = breakdown.reduce((sum, item) => sum + Number(item.count), 0);

    return breakdown.map((item) => ({
      type: item.type === 'DINE_IN' ? 'Dine-in' : 'Takeaway',
      count: Number(item.count),
      percentage: totalOrders > 0 ? (Number(item.count) / totalOrders) * 100 : 0,
    }));
  }

  async getSalesOverTime(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const salesData = await this.prisma.$queryRaw<
      Array<{ date: Date; revenue: string; orders: number }>
    >`
      SELECT 
        CAST(o."createdAt" as DATE) as date,
        SUM(CAST(p."totalAmount" AS DECIMAL(10,2))) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM payments p
      JOIN orders o ON p."orderId" = o.id
      WHERE 
        p."paidAt" >= ${startDate}
        AND p."paidAt" <= ${endDate}
        AND p.status = ${'PAID'}
      GROUP BY CAST(o."createdAt" as DATE)
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

    const hoursData = await this.prisma.$queryRaw<
      Array<{ hour: number; count: number }>
    >`
      SELECT 
        EXTRACT(HOUR FROM o."createdAt") as hour,
        COUNT(*) as count
      FROM orders o
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != ${'CANCELLED'}
      GROUP BY EXTRACT(HOUR FROM o."createdAt")
      ORDER BY hour ASC
    `;

    // Fill in missing hours with 0
    const result: any[] = [];
    for (let h = 0; h < 24; h++) {
      const hourData = hoursData.find((d) => d.hour === h);
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
}
