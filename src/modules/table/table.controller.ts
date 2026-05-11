import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, TableQueryDto, UpdateTableDto } from './table.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('table')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @InvalidateCache('table:all*')
  @HttpCode(HttpStatus.CREATED)
  async createTable(@Body() body: CreateTableDto): Promise<ApiResponse> {
    const data = await this.tableService.createTable(body);

    return {
      message: 'Table created successfully',
      data,
    };
  }

  @Get()
  @CacheKey('table:all')
  @CacheTTL(60 * 60) // 1 hour
  @HttpCode(HttpStatus.OK)
  async getAllTables(@Query() query: TableQueryDto): Promise<ApiResponse> {
    const [data, total] = await this.tableService.getAllTables(query);

    return {
      message: 'Tables retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get(':id')
  @CacheKey('table::params.id')
  @CacheTTL(60 * 60) // 1 hour
  @HttpCode(HttpStatus.OK)
  async getTableDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const table = await this.tableService.getTableDetails(id);

    return {
      message: 'Table details retrieved successfully',
      data: table,
    };
  }

  @Patch(':id')
  @InvalidateCache('table:all*', 'table::params.id')
  @HttpCode(HttpStatus.OK)
  async updateTable(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTableDto,
  ): Promise<ApiResponse> {
    const data = await this.tableService.updateTable(id, body);

    return {
      message: 'Table updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('table:all*', 'table::params.id')
  @HttpCode(HttpStatus.OK)
  async deleteTable(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.tableService.deleteTable(id);

    return {
      message: 'Table deleted successfully',
      data,
    };
  }
}
