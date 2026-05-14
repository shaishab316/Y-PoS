import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OperatingHoursService } from './operating-hours.service';
import { UpdateOperatingHoursDto } from './operating-hours.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('operating-hours')
export class OperatingHoursController {
  constructor(private readonly operatingHoursService: OperatingHoursService) {}

  @Get()
  @CacheKey('operating_hours')
  @CacheTTL(3600)
  async getOperatingHours(): Promise<ApiResponse> {
    const data = await this.operatingHoursService.getOperatingHours();

    return {
      success: true,
      message: 'Operating hours retrieved successfully',
      data,
    };
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @InvalidateCache('operating_hours')
  async updateOperatingHours(
    @Body() updateOperatingHoursDto: UpdateOperatingHoursDto,
  ): Promise<ApiResponse> {
    const data = await this.operatingHoursService.updateOperatingHours(
      updateOperatingHoursDto,
    );

    return {
      success: true,
      message: 'Operating hours updated successfully',
      data,
    };
  }
}
