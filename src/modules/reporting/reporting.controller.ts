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
}
