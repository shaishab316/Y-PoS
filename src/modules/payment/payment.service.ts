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
}
