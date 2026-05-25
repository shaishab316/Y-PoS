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
          verifiedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          cashier: {
            select: {
              id: true,
              name: true,
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
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
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

  async verifyPayment(
    paymentId: number,
    verifiedById: number,
    cashReceived: number,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return null;
    }

    // Check if cashReceived is less than totalAmount
    const totalAmount = Number(payment.totalAmount) || 0;
    const isMismatch = cashReceived < totalAmount;

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById,
        markAsMissMatch: isMismatch,
      },
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
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: updatedPayment.id,
      slug: updatedPayment.slug,
      orderId: updatedPayment.orderId,
      method: updatedPayment.method || 'CASH',
      status: updatedPayment.status || 'PENDING',
      subtotal: Number(updatedPayment.subtotal) || 0,
      chargesTotal: Number(updatedPayment.chargesTotal) || 0,
      totalAmount: Number(updatedPayment.totalAmount) || 0,
      cashReceived: updatedPayment.cashReceived
        ? Number(updatedPayment.cashReceived)
        : null,
      changeAmount: updatedPayment.changeAmount
        ? Number(updatedPayment.changeAmount)
        : null,
      proofImages: updatedPayment.proofImages || [],
      isVerified: updatedPayment.isVerified,
      markAsMissMatch: updatedPayment.markAsMissMatch,
      verifiedAt: updatedPayment.verifiedAt
        ? updatedPayment.verifiedAt.toISOString()
        : null,
      paidAt: updatedPayment.paidAt
        ? updatedPayment.paidAt.toISOString()
        : null,
      createdAt: updatedPayment.createdAt
        ? updatedPayment.createdAt.toISOString()
        : null,
      updatedAt: updatedPayment.updatedAt
        ? updatedPayment.updatedAt.toISOString()
        : null,
      order: updatedPayment.order,
      verifiedBy: updatedPayment.verifiedBy,
    };
  }
}
