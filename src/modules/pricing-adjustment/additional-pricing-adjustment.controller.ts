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
import { AdditionalPricingAdjustmentService } from './additional-pricing-adjustment.service';
import {
  CreateAdditionalPricingAdjustmentDto,
  UpdateAdditionalPricingAdjustmentDto,
  AdditionalPricingAdjustmentQueryDto,
} from './additional-pricing-adjustment.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('additional-pricing-adjustments')
export class AdditionalPricingAdjustmentController {
  constructor(
    private readonly additionalPricingAdjustmentService: AdditionalPricingAdjustmentService,
  ) {}

  @Post()
  @InvalidateCache('additionalPricingAdjustment:all*')
  @HttpCode(HttpStatus.CREATED)
  async createAdditionalPricingAdjustment(
    @Body() body: CreateAdditionalPricingAdjustmentDto,
  ): Promise<ApiResponse> {
    const data =
      await this.additionalPricingAdjustmentService.createAdditionalPricingAdjustment(
        body,
      );

    return {
      message: 'Additional pricing adjustment created successfully',
      data,
    };
  }

  @Get()
  @CacheKey('additionalPricingAdjustment:all')
  @CacheTTL(60 * 60)
  async getAllAdditionalPricingAdjustments(
    @Query() query: AdditionalPricingAdjustmentQueryDto,
  ): Promise<ApiResponse> {
    const [data, total] =
      await this.additionalPricingAdjustmentService.getAllAdditionalPricingAdjustments(
        query,
      );

    return {
      message: 'Additional pricing adjustments retrieved successfully',
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
  @CacheKey('additionalPricingAdjustment::params.id')
  @CacheTTL(60 * 60)
  async getAdditionalPricingAdjustmentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data =
      await this.additionalPricingAdjustmentService.getAdditionalPricingAdjustmentById(
        id,
      );

    return {
      message: 'Additional pricing adjustment retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @InvalidateCache('additionalPricingAdjustment:*')
  @HttpCode(HttpStatus.OK)
  async updateAdditionalPricingAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAdditionalPricingAdjustmentDto,
  ): Promise<ApiResponse> {
    const data =
      await this.additionalPricingAdjustmentService.updateAdditionalPricingAdjustment(
        id,
        body,
      );

    return {
      message: 'Additional pricing adjustment updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('additionalPricingAdjustment:*')
  @HttpCode(HttpStatus.OK)
  async deleteAdditionalPricingAdjustment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data =
      await this.additionalPricingAdjustmentService.deleteAdditionalPricingAdjustment(
        id,
      );

    return {
      message: 'Additional pricing adjustment deleted successfully',
      data,
    };
  }
}
