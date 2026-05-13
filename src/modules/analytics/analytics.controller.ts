import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DateRangeQueryDto } from './analytics.dto';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Query() query: DateRangeQueryDto): Promise<ApiResponse> {
    const data = await this.analyticsService.getCompleteSalesMetrics(query);
    return {
      success: true,
      data,
    };
  }
}
