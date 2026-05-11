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

@Controller('table')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @InvalidateCache('table:all*')
  @HttpCode(HttpStatus.CREATED)
  async createTable(@Body() body: CreateTableDto) {
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
  async getAllTables(@Query() query: TableQueryDto) {
    const result = await this.tableService.getAllTables(query);

    return {
      message: 'Tables retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @CacheKey('table::params.id')
  @CacheTTL(60 * 60) // 1 hour
  @HttpCode(HttpStatus.OK)
  async getTableDetails(@Param('id', ParseIntPipe) id: number) {
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
  ) {
    const data = await this.tableService.updateTable(id, body);

    return {
      message: 'Table updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('table:all*', 'table::params.id')
  @HttpCode(HttpStatus.OK)
  async deleteTable(@Param('id', ParseIntPipe) id: number) {
    const data = await this.tableService.deleteTable(id);

    return {
      message: 'Table deleted successfully',
      data,
    };
  }
}
