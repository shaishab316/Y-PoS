import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  InventoryQueryDto,
  StockInDto,
  StockOutDto,
  ReportQueryDto,
} from './inventory.dto';
import * as ExcelJS from 'exceljs';

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
      meta: {
        lowStack: await this.getLowStack(),
        outOfStock: await this.getOutOfStack(),
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

    // Get the most recent log (could be from today or before)
    const lastLog = await this.prisma.inventoryLog.findFirst({
      where: { itemId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // Opening stock is the last log's closing stock, or current item qty if no log exists
    const openingStock = lastLog?.closingStock ?? item.inventoryQty ?? 0;

    // Closing stock = opening + stock in
    const closingStock = openingStock + qty;

    // Update item inventory
    const updatedItem = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        inventoryQty: closingStock,
        slug: item.slug || itemId.toString(),
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

    // Get the most recent log (could be from today or before)
    const lastLog = await this.prisma.inventoryLog.findFirst({
      where: { itemId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // Opening stock is the last log's closing stock, or current item qty if no log exists
    const openingStock = lastLog?.closingStock ?? item.inventoryQty ?? 0;

    // Closing stock = opening - stock out
    const closingStock = openingStock - qty;

    // Validate sufficient stock
    if (closingStock < 0) {
      throw new Error(
        `Insufficient stock. Available: ${openingStock}, Requested: ${qty}`,
      );
    }

    // Update item inventory
    const updatedItem = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        inventoryQty: closingStock,
        slug: item.slug || itemId.toString(),
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

  async exportInventoryLogsToExcel(
    query: InventoryQueryDto,
  ): Promise<Uint8Array> {
    const { startDate, endDate } = query;

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

    const logs = await this.prisma.inventoryLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Logs');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Item Name', key: 'itemName', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Opening Stock', key: 'openingStock', width: 15 },
      { header: 'Stock In', key: 'stockIn', width: 12 },
      { header: 'Stock Out', key: 'stockOut', width: 12 },
      { header: 'Stock Sold', key: 'stockSold', width: 12 },
      { header: 'Closing Stock', key: 'closingStock', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' },
    };

    // Add data rows
    logs.forEach((log) => {
      worksheet.addRow({
        id: log.slug ?? log.id,
        itemName: log.itemName,
        date: log.date ? new Date(log.date).toLocaleDateString() : '',
        openingStock: log.openingStock ?? 0,
        stockIn: log.stockIn ?? 0,
        stockOut: log.stockOut ?? 0,
        stockSold: log.stockSold ?? 0,
        closingStock: log.closingStock ?? 0,
        remarks: log.remarks ?? '',
        createdAt: log.createdAt
          ? new Date(log.createdAt).toLocaleString()
          : '',
      });
    });

    // Add summary section
    const lastRow = worksheet.lastRow?.number ?? 1;
    const summaryRow = lastRow + 2;

    worksheet.getCell(`A${summaryRow}`).value = 'SUMMARY';
    worksheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };

    const totalStockIn = logs.reduce((sum, log) => sum + (log.stockIn ?? 0), 0);
    const totalStockOut = logs.reduce(
      (sum, log) => sum + (log.stockOut ?? 0),
      0,
    );
    const totalSold = logs.reduce((sum, log) => sum + (log.stockSold ?? 0), 0);

    worksheet.getCell(`A${summaryRow + 1}`).value = 'Total Stock In:';
    worksheet.getCell(`B${summaryRow + 1}`).value = totalStockIn;
    worksheet.getCell(`A${summaryRow + 2}`).value = 'Total Stock Out:';
    worksheet.getCell(`B${summaryRow + 2}`).value = totalStockOut;
    worksheet.getCell(`A${summaryRow + 3}`).value = 'Total Sold:';
    worksheet.getCell(`B${summaryRow + 3}`).value = totalSold;

    // Generate buffer
    return (await workbook.xlsx.writeBuffer()) as unknown as Uint8Array;
  }

  private calculateSummary(logs: any[]) {
    return {
      totalStockIn: logs.reduce((sum, log) => sum + (log.stockIn || 0), 0),
      totalStockOut: logs.reduce((sum, log) => sum + (log.stockOut || 0), 0),
      totalSold: logs.reduce((sum, log) => sum + (log.stockSold || 0), 0),
      uniqueItems: new Set(logs.map((log) => log.itemId)).size,
    };
  }

  // stack is <= 5 but > 0
  async getLowStack() {
    return this.prisma.item.findMany({
      where: {
        inventoryQty: {
          lte: 5,
          gt: 0,
        },
      },
    });
  }

  async getOutOfStack() {
    return this.prisma.item.findMany({
      where: {
        OR: [
          { inventoryQty: { lte: 0 } },
          {
            isOutOfStock: true,
          },
        ],
      },
    });
  }
}
