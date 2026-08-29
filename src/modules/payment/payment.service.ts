import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  PaymentQueryDto,
  UpdatePaymentVerificationStatusDto,
} from './payment.dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPayments(query: PaymentQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      status: 'PAID',
      verificationStatus: 'PENDING',
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
      where.order = {
        OR: [
          {
            slug: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            customerName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            orderItems: {
              some: {
                itemName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      };
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
        verificationStatus: 'PENDING',
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
      { header: 'Payment ID', key: 'id', width: 15 },
      { header: 'Order ID', key: 'orderId', width: 15 },
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
      { header: 'Verification Status', key: 'verificationStatus', width: 18 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Paid At', key: 'paidAt', width: 20 },
    ];

    // Add data rows
    payments.forEach((payment) => {
      const itemNames = payment.order?.orderItems
        ?.map((item) => `${item.itemName} (x${item.quantity})`)
        .join(', ');

      worksheet.addRow({
        id: payment.slug || 'N/A',
        orderId: payment.order?.slug || 'N/A',
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
        verificationStatus: payment.verificationStatus || 'PENDING',
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

  async getTodayPaymentsSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereToday = {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    };

    // Get total amount of today's payments (all methods)
    const totalPayments = await this.prisma.payment.aggregate({
      where: whereToday,
      _sum: { totalAmount: true },
    });
    const totalAmount = Number(totalPayments._sum.totalAmount) || 0;

    // Get income cash (method = CASH, excluding TRANSFER)
    const cashPayments = await this.prisma.payment.aggregate({
      where: { ...whereToday, method: 'CASH' },
      _sum: { totalAmount: true },
    });
    const incomeCash = Number(cashPayments._sum.totalAmount) || 0;

    // Get income transfer (method = TRANSFER)
    const transferPayments = await this.prisma.payment.aggregate({
      where: { ...whereToday, method: 'TRANSFER' },
      _sum: { totalAmount: true },
    });
    const incomeTransfer = Number(transferPayments._sum.totalAmount) || 0;

    // Get opening cash = previous day's closing cash from the last PaymentVerify
    const lastVerification = await this.prisma.paymentVerify.findFirst({
      orderBy: { date: 'desc' },
      select: { closingCash: true },
    });
    const openingCash = lastVerification?.closingCash
      ? Number(lastVerification.closingCash)
      : 0;

    // Get count of already submitted payment verifications for today
    const alreadyVerifiedCount = await this.prisma.paymentVerify.count({
      where: {
        verifiedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      totalAmount,
      incomeCash,
      incomeTransfer,
      openingCash,
      alreadyVerified: alreadyVerifiedCount,
    };
  }

  async createTodayPaymentVerify(dto: {
    totalSales: number | null;
    actualSales: number | null;
    remark?: string | null;
    proofImages?: string[];
    verifiedById: number;
    openingCash?: number | null;
    cashIn?: number | null;
    totalOpeningCash?: number | null;
    incomeCash?: number | null;
    actualIncomeCash?: number | null;
    incomeTransfer?: number | null;
    actualTransfer?: number | null;
    expensesCash?: number | null;
    expenseRemark?: string | null;
    cashDeposit?: string[];
    closingCash?: number | null;
  }) {
    const paymentVerify = await this.prisma.paymentVerify.create({
      data: {
        date: new Date(),
        totalAmount: dto.totalSales,
        actualAmount: dto.actualSales,
        remark: dto.remark ?? null,
        proofImages: dto.proofImages ?? [],
        verifiedById: dto.verifiedById,
        // Opening
        openingCash: dto.openingCash ?? null,
        cashIn: dto.cashIn ?? null,
        totalOpeningCash: dto.totalOpeningCash ?? null,
        // Sales
        incomeCash: dto.incomeCash ?? null,
        actualIncomeCash: dto.actualIncomeCash ?? null,
        incomeTransfer: dto.incomeTransfer ?? null,
        actualTransfer: dto.actualTransfer ?? null,
        totalSales: dto.totalSales ?? null,
        actualSales: dto.actualSales ?? null,
        // CashOut
        expensesCash: dto.expensesCash ?? null,
        expenseRemark: dto.expenseRemark ?? null,
        cashDeposit: dto.cashDeposit ?? [],
        // Closing
        closingCash: dto.closingCash ?? null,
      },
      include: {
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: paymentVerify.id,
      date: paymentVerify.date ? paymentVerify.date.toISOString() : null,
      totalAmount: Number(paymentVerify.totalAmount) || 0,
      actualAmount: Number(paymentVerify.actualAmount) || 0,
      remark: paymentVerify.remark,
      proofImages: paymentVerify.proofImages || [],
      verifiedAt: paymentVerify.verifiedAt
        ? paymentVerify.verifiedAt.toISOString()
        : null,
      verifiedBy: paymentVerify.verifiedBy,
    };
  }

  async updateVerificationStatus(
    paymentId: number,
    dto: UpdatePaymentVerificationStatusDto,
  ) {
    const { status, verifiedById, correctAmount, mismatchReason } = dto;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return null;
    }

    const isMismatch = status === 'MISMATCH';
    const isVerified = status !== 'PENDING';

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        verificationStatus: status,
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedById: isVerified ? verifiedById : null,
        markAsMissMatch: isMismatch,
        correctAmount,
        mismatchReason,
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
      verificationStatus: updatedPayment.verificationStatus,
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

  async getWhatsAppUrlForVerification(
    verifiedById: number,
    totalAmount: number,
    actualAmount: number,
    remark: string | null,
    proofImages: string[] = [],
  ) {
    // 1. Fetch business name from BusinessProfile
    const business = await this.prisma.businessProfile.findFirst();
    const businessName = business?.name || 'Smart POS';

    // 2. Fetch owner's phone number
    const owner = await this.prisma.user.findFirst({
      where: {
        role: 'OWNER',
        isActive: true,
      },
      select: {
        phone: true,
        businessPhone: true,
      },
    });

    const ownerPhone = owner?.businessPhone || owner?.phone || '';
    const cleanPhone = ownerPhone.replace(/\D/g, '');

    // 3. Format date
    const dateStr = this.formatWhatsAppDate(new Date());

    // 4. Determine status
    const isMismatch = actualAmount !== totalAmount;
    const statusText = isMismatch ? '❌ MISMATCH' : '✅ MATCH';

    // 5. Parse Cash in Store and calculate Deposit
    const cashInStore = this.parseCashInStore(remark);
    const depositAmount = actualAmount - cashInStore;

    // 6. Clean remark and split cash in store
    let cleanRemark = remark || '';
    let cashInStoreLine = '';

    const cashInStoreIndex = cleanRemark.toLowerCase().indexOf('cash in store');
    if (cashInStoreIndex !== -1) {
      cashInStoreLine = cleanRemark.substring(cashInStoreIndex).trim();
      cleanRemark = cleanRemark.substring(0, cashInStoreIndex).trim();
      cleanRemark = cleanRemark.replace(/[,.\s]+$/, '');
    }

    if (cleanRemark === '') {
      cleanRemark = remark || '';
      cashInStoreLine = '';
    }

    // 7. Format IDR helper
    const formatIDR = (val: number) => {
      const formatted = Math.round(val)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `Rp ${formatted}`;
    };

    // 8. Build message
    let textMessage = `Closing Sales Report
${businessName}
${dateStr}

Sales: ${formatIDR(totalAmount)}
Funds Received: ${formatIDR(actualAmount)}

${statusText}
_________

Deposit: ${formatIDR(depositAmount)}
`;

    if (cleanRemark) {
      textMessage += `\nRemarks: ${cleanRemark}`;
    }

    if (cashInStoreLine) {
      textMessage += `\n\n${cashInStoreLine}`;
    }

    if (proofImages && proofImages.length > 0) {
      textMessage += `\n\nProof Images:\n` + proofImages.join('\n');
    }

    // 9. Generate url encoded text
    const encodedText = encodeURIComponent(textMessage);

    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  private formatWhatsAppDate(date: Date): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
  }

  private parseCashInStore(remark: string | null | undefined): number {
    if (!remark) return 0;
    const regex = /cash\s+in\s+store\s*(?:rp\.?|:)?\s*([\d.]+)/i;
    const match = remark.match(regex);
    if (match) {
      const numStr = match[1].replace(/\./g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }
}
