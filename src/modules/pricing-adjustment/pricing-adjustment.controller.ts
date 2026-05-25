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
import { PricingAdjustmentService } from './pricing-adjustment.service';
import {
  CreatePricingAdjustmentDto,
  UpdatePricingAdjustmentDto,
  PricingAdjustmentQueryDto,
} from './pricing-adjustment.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('pricing-adjustments')
export class PricingAdjustmentController {
  constructor(
    private readonly pricingAdjustmentService: PricingAdjustmentService,
  ) {}

  @Post()
  @InvalidateCache('pricingAdjustment:all*')
  @HttpCode(HttpStatus.CREATED)
  async createPricingAdjustment(
    @Body() body: CreatePricingAdjustmentDto,
  ): Promise<ApiResponse> {
    const data =
      await this.pricingAdjustmentService.createPricingAdjustment(body);

    return { message: 'Pricing adjustment created successfully', data };
  }

  @Get()
  @CacheKey('pricingAdjustment:all')
  @CacheTTL(60 * 60)
  async getAllPricingAdjustments(
    @Query() query: PricingAdjustmentQueryDto,
  ): Promise<ApiResponse> {
    const [data, total] =
      await this.pricingAdjustmentService.getAllPricingAdjustments(query);

    return {
      message: 'Pricing adjustments retrieved successfully',
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
  @CacheKey('pricingAdjustment::params.id')
  @CacheTTL(60 * 60)
  async getPricingAdjustmentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data =
      await this.pricingAdjustmentService.getPricingAdjustmentById(id);

    return { message: 'Pricing adjustment retrieved successfully', data };
  }

  @Patch(':id')
  @InvalidateCache('pricingAdjustment:*')
  @HttpCode(HttpStatus.OK)
  async updatePricingAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePricingAdjustmentDto,
  ): Promise<ApiResponse> {
    const data = await this.pricingAdjustmentService.updatePricingAdjustment(
      id,
      body,
    );

    return { message: 'Pricing adjustment updated successfully', data };
  }

  @Delete(':id')
  @InvalidateCache('pricingAdjustment:*')
  @HttpCode(HttpStatus.OK)
  async deletePricingAdjustment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data =
      await this.pricingAdjustmentService.deletePricingAdjustment(id);

    return { message: 'Pricing adjustment deleted successfully', data };
  }
}
