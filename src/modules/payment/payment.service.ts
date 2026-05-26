import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PaymentQueryDto } from './payment.dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPayments(query: PaymentQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      isVerified: false,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
        lt: new Date(new Date().setHours(24, 0, 0, 0)), // Start of tomorrow
      },
    };
    // if (status) {
    //   where.status = status;
    // }
    // if (method) {
    //   where.method = method;
    // }

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
            include: {
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
          include: {
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

  async getTodayPayments() {
    return await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
          lt: new Date(new Date().setHours(24, 0, 0, 0)), // Start of tomorrow
        },
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                productionStation: true,
              },
            },
            table: true,
          },
        },
        cashier: {
          omit: {
            passwordHash: true,
          },
        },
        verifiedBy: {
          omit: {
            passwordHash: true,
          },
        },
      },
    });
  }

  async exportTodayPaymentsToExcel() {
    const payments = await this.getTodayPayments();

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Today Payments');

    // Define columns
    worksheet.columns = [
      { header: 'Payment ID', key: 'id', width: 10 },
      { header: 'Slug', key: 'slug', width: 15 },
      { header: 'Order ID', key: 'orderId', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Payment Method', key: 'method', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Charges Total', key: 'chargesTotal', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 12 },
      { header: 'Cash Received', key: 'cashReceived', width: 12 },
      { header: 'Change Amount', key: 'changeAmount', width: 12 },
      { header: 'Items', key: 'items', width: 30 },
      { header: 'Table Number', key: 'tableNumber', width: 12 },
      { header: 'Cashier Name', key: 'cashierName', width: 15 },
      { header: 'Verified By', key: 'verifiedByName', width: 15 },
      { header: 'Is Verified', key: 'isVerified', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Paid At', key: 'paidAt', width: 20 },
    ];

    // Add data rows
    payments.forEach((payment) => {
      const itemNames = payment.order?.orderItems
        ?.map((item) => `${item.itemName} (x${item.quantity})`)
        .join(', ');

      worksheet.addRow({
        id: payment.id,
        slug: payment.slug,
        orderId: payment.orderId,
        customerName: payment.order?.customerName || 'N/A',
        method: payment.method || 'CASH',
        status: payment.status || 'PENDING',
        subtotal: Number(payment.subtotal) || 0,
        chargesTotal: Number(payment.chargesTotal) || 0,
        totalAmount: Number(payment.totalAmount) || 0,
        cashReceived: payment.cashReceived
          ? Number(payment.cashReceived)
          : 'N/A',
        changeAmount: payment.changeAmount
          ? Number(payment.changeAmount)
          : 'N/A',
        items: itemNames || 'N/A',
        tableNumber: payment.order?.table?.tableNumber || 'N/A',
        cashierName: payment.cashier?.name || 'N/A',
        verifiedByName: payment.verifiedBy?.name || 'N/A',
        isVerified: payment.isVerified ? 'Yes' : 'No',
        createdAt: payment.createdAt
          ? new Date(payment.createdAt).toLocaleString()
          : 'N/A',
        paidAt: payment.paidAt
          ? new Date(payment.paidAt).toLocaleString()
          : 'N/A',
      });
    });

    // Style the header row
    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // Auto-fit columns based on content
    worksheet.columns.forEach((column) => {
      column.width = Math.min(column.width || 15, 50);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
