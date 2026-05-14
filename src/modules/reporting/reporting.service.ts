import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DateRangeQueryDto } from './reporting.dto';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(query: DateRangeQueryDto) {
    let startDate = new Date();
    let endDate = new Date();

    if (query.startDate) {
      startDate = new Date(query.startDate);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    if (query.endDate) {
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  async getSalesReport(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const orderStats = await this.prisma.$queryRaw<
      Array<{
        status: string;
        count: bigint;
        totalRevenue: string;
      }>
    >`
      SELECT 
        o.status,
        COUNT(*)::bigint as count,
        COALESCE(SUM(o."totalAmount")::numeric, '0') as "totalRevenue"
      FROM orders o
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY o.status
    `;

    const totalOrders = orderStats.reduce(
      (sum, stat) => sum + Number(stat.count),
      0,
    );
    const totalRevenue = orderStats.reduce(
      (sum, stat) => sum + parseFloat(stat.totalRevenue || '0'),
      0,
    );

    const ordersByStatus: Record<string, number> = {};
    orderStats.forEach((stat) => {
      ordersByStatus[stat.status] = Number(stat.count);
    });

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      ordersByStatus,
    };
  }

  async getTopSellers(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const topItems = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        totalSold: bigint;
        totalRevenue: string;
      }>
    >`
      SELECT 
        i.id,
        i.name,
        SUM(oi.quantity)::bigint as "totalSold",
        COALESCE(SUM(oi.quantity * oi."unitPrice")::numeric, '0') as "totalRevenue"
      FROM order_items oi
      JOIN items i ON oi."itemId" = i.id
      JOIN orders o ON oi."orderId" = o.id
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != 'CANCELLED'
      GROUP BY i.id, i.name
      ORDER BY "totalSold" DESC
      LIMIT 10
    `;

    const totalItemsSold = topItems.reduce(
      (sum, item) => sum + Number(item.totalSold),
      0,
    );

    const topSellers = topItems.map((item) => ({
      id: item.id,
      name: item.name,
      totalSold: Number(item.totalSold),
      totalRevenue: parseFloat(item.totalRevenue || '0'),
      averagePrice:
        Number(item.totalSold) > 0
          ? parseFloat(item.totalRevenue || '0') / Number(item.totalSold)
          : 0,
    }));

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      topSellers,
      totalItemsSold,
    };
  }

  async getOrderTypesReport(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const orderTypeStats = await this.prisma.$queryRaw<
      Array<{
        orderType: string | null;
        count: bigint;
        totalRevenue: string;
      }>
    >`
      SELECT 
        o.type as "orderType",
        COUNT(*)::bigint as count,
        COALESCE(SUM(o."totalAmount")::numeric, '0') as "totalRevenue"
      FROM orders o
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != 'CANCELLED'
      GROUP BY o.type
      ORDER BY count DESC
    `;

    const totalOrders = orderTypeStats.reduce(
      (sum, stat) => sum + Number(stat.count),
      0,
    );

    const orderTypes = orderTypeStats
      .filter((stat) => stat.orderType !== null)
      .map((stat) => ({
        type: stat.orderType || 'UNKNOWN',
        count: Number(stat.count),
        percentage:
          totalOrders > 0 ? (Number(stat.count) / totalOrders) * 100 : 0,
        totalRevenue: parseFloat(stat.totalRevenue || '0'),
        averageOrderValue:
          Number(stat.count) > 0
            ? parseFloat(stat.totalRevenue || '0') / Number(stat.count)
            : 0,
      }));

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      orderTypes,
      totalOrders,
    };
  }

  async getProductionPerformance(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const stationStats = await this.prisma.$queryRaw<
      Array<{
        stationId: number;
        stationName: string;
        itemCount: bigint;
        avgProductionTime: string;
      }>
    >`
      SELECT 
        ps.id as "stationId",
        ps.name as "stationName",
        COUNT(oi.id)::bigint as "itemCount",
        AVG(EXTRACT(EPOCH FROM (oi."readyAt" - o."createdAt")))::numeric as "avgProductionTime"
      FROM order_items oi
      JOIN orders o ON oi."orderId" = o.id
      JOIN production_stations ps ON oi."productionStationId" = ps.id
      WHERE 
        o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND oi.status = 'READY'
        AND oi."readyAt" IS NOT NULL
      GROUP BY ps.id, ps.name
    `;

    const totalItemsOverall = stationStats.reduce(
      (sum, stat) => sum + Number(stat.itemCount),
      0,
    );
    const avgTimeOverall =
      stationStats.length > 0
        ? stationStats.reduce(
            (sum, stat) =>
              sum +
              (stat.avgProductionTime ? parseFloat(stat.avgProductionTime) : 0),
            0,
          ) / stationStats.length
        : 0;

    const stations = await Promise.all(
      stationStats.map(async (stat) => {
        const items = await this.prisma.$queryRaw<
          Array<{
            itemName: string;
            count: bigint;
            avgTime: string;
          }>
        >`
          SELECT 
            i.name as "itemName",
            COUNT(oi.id)::bigint as count,
            AVG(EXTRACT(EPOCH FROM (oi."readyAt" - o."createdAt")))::numeric as "avgTime"
          FROM order_items oi
          JOIN orders o ON oi."orderId" = o.id
          JOIN items i ON oi."itemId" = i.id
          WHERE 
            oi."productionStationId" = ${stat.stationId}
            AND o."createdAt" >= ${startDate}
            AND o."createdAt" <= ${endDate}
            AND oi.status = 'READY'
            AND oi."readyAt" IS NOT NULL
          GROUP BY i.id, i.name
          ORDER BY count DESC
          LIMIT 5
        `;

        return {
          stationId: stat.stationId,
          stationName: stat.stationName,
          totalItemsProduced: Number(stat.itemCount),
          averageProductionTime: stat.avgProductionTime
            ? parseFloat(stat.avgProductionTime)
            : 0,
          efficiency:
            avgTimeOverall > 0
              ? (avgTimeOverall /
                  (stat.avgProductionTime
                    ? parseFloat(stat.avgProductionTime)
                    : avgTimeOverall)) *
                100
              : 100,
          itemsBreakdown: items.map((item) => ({
            itemName: item.itemName,
            count: Number(item.count),
            avgTime: item.avgTime ? parseFloat(item.avgTime) : 0,
          })),
        };
      }),
    );

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      stations,
      overallEfficiency:
        stations.length > 0
          ? stations.reduce((sum, s) => sum + s.efficiency, 0) / stations.length
          : 0,
    };
  }

  async getProofImagesReport(query: DateRangeQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        orderId: true,
        proofImages: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const images: Array<{
      id: number;
      orderId: number | null;
      imageUrl: string;
      uploadedAt: string;
      status: string;
    }> = [];

    const statusCounts: Record<string, number> = {};

    payments.forEach((payment) => {
      if (
        payment.proofImages &&
        Array.isArray(payment.proofImages) &&
        payment.proofImages.length > 0
      ) {
        payment.proofImages.forEach((imageUrl, index) => {
          images.push({
            id: payment.id * 1000 + index,
            orderId: payment.orderId,
            imageUrl: imageUrl as string,
            uploadedAt:
              payment.createdAt?.toISOString() || new Date().toISOString(),
            status: payment.status || 'UNKNOWN',
          });
          statusCounts[payment.status || 'UNKNOWN'] =
            (statusCounts[payment.status || 'UNKNOWN'] || 0) + 1;
        });
      }
    });

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      images,
      totalImages: images.length,
      byStatus: statusCounts,
    };
  }
}
