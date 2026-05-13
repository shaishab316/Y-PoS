import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  InventoryQueryDto,
  StockInDto,
  StockOutDto,
  ReportQueryDto,
} from './inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(query: InventoryQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where: {
          isVisible: true,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          inventoryQty: true,
          price: true,
          imageUrl: true,
          isOutOfStock: true,
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.item.count({
        where: {
          isVisible: true,
        },
      }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryLogs(query: InventoryQueryDto) {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async stockIn(body: StockInDto) {
    const { itemId, qty, remarks } = body;

    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get opening stock (last closing stock of previous day or current item qty)
    const lastLog = await this.prisma.inventoryLog.findFirst({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
    });

    const openingStock = lastLog?.closingStock ?? item.inventoryQty ?? 0;

    // Calculate closing stock: opening + stock in - stock out (today)
    const todayLogs = await this.prisma.inventoryLog.findMany({
      where: {
        itemId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalStockOut = todayLogs.reduce(
      (sum, log) => sum + (log.stockOut || 0),
      0,
    );
    const totalStockIn =
      todayLogs.reduce((sum, log) => sum + (log.stockIn || 0), 0) + qty;

    const closingStock = openingStock + totalStockIn - totalStockOut;

    // Update item inventory
    const updatedItem = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        inventoryQty: closingStock,
      },
    });

    // Log the stock in
    const log = await this.prisma.inventoryLog.create({
      data: {
        itemId,
        itemName: item.name,
        date: today,
        openingStock,
        stockIn: qty,
        closingStock,
        remarks,
      },
    });

    return {
      message: 'Stock in recorded successfully',
      log,
      newQty: updatedItem.inventoryQty,
    };
  }

  async stockOut(body: StockOutDto) {
    const { itemId, qty, remarks } = body;

    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get opening stock (last closing stock of previous day or current item qty)
    const lastLog = await this.prisma.inventoryLog.findFirst({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
    });

    const openingStock = lastLog?.closingStock ?? item.inventoryQty ?? 0;

    // Calculate current day's movements
    const todayLogs = await this.prisma.inventoryLog.findMany({
      where: {
        itemId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalStockOut =
      todayLogs.reduce((sum, log) => sum + (log.stockOut || 0), 0) + qty;
    const totalStockIn = todayLogs.reduce(
      (sum, log) => sum + (log.stockIn || 0),
      0,
    );

    const closingStock = openingStock + totalStockIn - totalStockOut;

    // Validate sufficient stock
    if (closingStock < 0) {
      throw new Error(
        `Insufficient stock. Available: ${openingStock + totalStockIn}, Requested: ${qty}`,
      );
    }

    // Update item inventory
    const updatedItem = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        inventoryQty: closingStock,
      },
    });

    // Log the stock out
    const log = await this.prisma.inventoryLog.create({
      data: {
        itemId,
        itemName: item.name,
        date: today,
        openingStock,
        stockOut: qty,
        closingStock,
        remarks,
      },
    });

    return {
      message: 'Stock out recorded successfully',
      log,
      newQty: updatedItem.inventoryQty,
    };
  }

  async getReport(query: ReportQueryDto) {
    const { startDate, endDate, export: exportFormat } = query;

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const logs = await this.prisma.inventoryLog.findMany({
      where: {
        date: {
          gte: startDateObj,
          lte: endDateObj,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const report = {
      period: {
        startDate: startDateObj,
        endDate: endDateObj,
      },
      summary: this.calculateSummary(logs),
      details: logs,
    };

    if (exportFormat === 'PDF') {
      // TODO: Implement PDF export
      return { message: 'PDF export will be implemented', data: report };
    }

    if (exportFormat === 'EXCEL') {
      // TODO: Implement Excel export
      return { message: 'Excel export will be implemented', data: report };
    }

    return report;
  }

  private calculateSummary(logs: any[]) {
    return {
      totalStockIn: logs.reduce((sum, log) => sum + (log.stockIn || 0), 0),
      totalStockOut: logs.reduce((sum, log) => sum + (log.stockOut || 0), 0),
      totalSold: logs.reduce((sum, log) => sum + (log.stockSold || 0), 0),
      uniqueItems: new Set(logs.map((log) => log.itemId)).size,
    };
  }
}
