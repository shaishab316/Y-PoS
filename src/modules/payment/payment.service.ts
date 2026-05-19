import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PaymentQueryDto } from './payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPayments(query: PaymentQueryDto) {
    const { page, limit, status, method, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (method) {
      where.method = method;
    }
    if (search) {
      where.OR = [
        {
          order: {
            id: isNaN(Number(search)) ? undefined : Number(search),
          },
        },
        {
          order: {
            customerName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          order: {
            orderItems: {
              some: {
                itemName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ];
    }

    return await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              slug: true,
              customerName: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
  }

  async getPaymentById(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            slug: true,
            customerName: true,
            type: true,
            totalAmount: true,
            orderItems: {
              select: {
                id: true,
                itemName: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      slug: payment.slug,
      orderId: payment.orderId,
      method: payment.method || 'CASH',
      status: payment.status || 'PENDING',
      subtotal: Number(payment.subtotal) || 0,
      chargesTotal: Number(payment.chargesTotal) || 0,
      totalAmount: Number(payment.totalAmount) || 0,
      cashReceived: payment.cashReceived ? Number(payment.cashReceived) : null,
      changeAmount: payment.changeAmount ? Number(payment.changeAmount) : null,
      proofImages: payment.proofImages || [],
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
      createdAt: payment.createdAt ? payment.createdAt.toISOString() : null,
      updatedAt: payment.updatedAt ? payment.updatedAt.toISOString() : null,
      order: payment.order,
    };
  }

  async getPaymentMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate today's earnings
    const todayPayments = await this.prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const todayEarning = Number(todayPayments._sum.totalAmount) || 0;

    // Calculate yesterday's earnings
    const yesterdayPayments = await this.prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        status: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const yesterdayEarning = Number(yesterdayPayments._sum.totalAmount) || 0;

    // Calculate growth rate
    let todayGrowthRate = 0;
    if (yesterdayEarning > 0) {
      todayGrowthRate =
        ((todayEarning - yesterdayEarning) / yesterdayEarning) * 100;
    } else if (todayEarning > 0) {
      todayGrowthRate = 100;
    }

    return {
      todayEarning,
      todayGrowthRate: Math.round(todayGrowthRate * 100) / 100, // Round to 2 decimal places
    };
  }
}
