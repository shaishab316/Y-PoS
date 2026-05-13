import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  InventoryQueryDto,
  StockInDto,
  StockOutDto,
  ReportQueryDto,
} from './inventory.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get latest inventory',
    description: 'Retrieve current stock levels for all items',
  })
  async getInventory(@Query() query: InventoryQueryDto) {
    return await this.inventoryService.getInventory(query);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get inventory logs',
    description:
      'Retrieve inventory transaction logs with optional filtering by date',
  })
  async getInventoryLogs(@Query() query: InventoryQueryDto) {
    return await this.inventoryService.getInventoryLogs(query);
  }

  @Post('stock-in')
  @ApiOperation({
    summary: 'Record stock in',
    description: 'Record incoming stock for an item',
  })
  async stockIn(@Body() body: StockInDto) {
    return this.inventoryService.stockIn(body);
  }

  @Post('stock-out')
  @ApiOperation({
    summary: 'Record stock out',
    description: 'Record outgoing stock (spoilage, damage, etc.) for an item',
  })
  async stockOut(@Body() body: StockOutDto) {
    return this.inventoryService.stockOut(body);
  }

  @Get('report')
  @ApiOperation({
    summary: 'Get inventory report',
    description: 'Generate inventory report with optional PDF or Excel export',
  })
  async getReport(@Query() query: ReportQueryDto) {
    return this.inventoryService.getReport(query);
  }
}
