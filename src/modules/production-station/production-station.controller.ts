import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductionStationService } from './production-station.service';
import {
  CreateProductionStationDto,
  UpdateProductionStationDto,
} from './production-station.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('production-station')
export class ProductionStationController {
  constructor(
    private readonly productionStationService: ProductionStationService,
  ) {}

  @Post()
  @InvalidateCache('production-station:all')
  @HttpCode(HttpStatus.CREATED)
  async createProductionStation(
    @Body() body: CreateProductionStationDto,
  ): Promise<ApiResponse> {
    const data =
      await this.productionStationService.createProductionStation(body);

    return {
      message: 'Production Station created successfully',
      data,
    };
  }

  @Get()
  @CacheKey('production-station:all')
  @CacheTTL(60 * 60) // 1 hour
  async getAllProductionStations(): Promise<ApiResponse> {
    const data = await this.productionStationService.getAllProductionStations();

    return {
      message: 'Production Stations fetched successfully',
      data,
    };
  }

  @Get(':id')
  @CacheKey('production-station::params.id')
  @CacheTTL(60 * 60) // 1 hour
  async getProductionStationDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data =
      await this.productionStationService.getProductionStationDetails(id);

    return {
      message: 'Production Station details fetched successfully',
      data,
    };
  }

  @Patch(':id')
  @InvalidateCache('production-station:all', 'production-station::params.id')
  @HttpCode(HttpStatus.OK)
  async updateProductionStation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductionStationDto,
  ): Promise<ApiResponse> {
    const data = await this.productionStationService.updateProductionStation(
      id,
      body,
    );

    return {
      message: 'Production Station updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('production-station:all', 'production-station::params.id')
  @HttpCode(HttpStatus.OK)
  async deleteProductionStation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data =
      await this.productionStationService.deleteProductionStation(id);

    return {
      message: 'Production Station deleted successfully',
      data,
    };
  }
}
