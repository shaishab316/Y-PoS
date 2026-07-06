import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { DateRangeQueryDto } from './reporting.dto';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get()
  async getComprehensiveReport(
    @Query() query: DateRangeQueryDto,
  ): Promise<ApiResponse> {
    const [sales, topSellers, orderTypes, productionPerformance, proofImages] =
      await Promise.all([
        this.reportingService.getSalesReport(query),
        this.reportingService.getTopSellers(query),
        this.reportingService.getOrderTypesReport(query),
        this.reportingService.getProductionPerformance(query),
        this.reportingService.getProofImagesReport(query),
      ]);

    const data = {
      period: sales.period,
      sales,
      topSellers,
      orderTypes,
      productionPerformance,
      proofImages,
    };

    return {
      message: 'Comprehensive report generated successfully',
      data,
    };
  }

  @Get('efficiency')
  async getEfficiencyReport(
    @Query() query: DateRangeQueryDto,
  ): Promise<ApiResponse> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const data = await this.reportingService.getEfficiencyReport({
      ...query,
      startDate: todayStr,
      endDate: todayStr,
    });

    return {
      message: 'Efficiency report generated successfully',
      data,
    };
  }
}
