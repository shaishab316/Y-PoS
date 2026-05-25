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
    const data = await this.reportingService.getEfficiencyReport(query);

    data.mostPopularByStation.map((station) => {
      if (!station.items.length) {
        station.items.push({
          id: 0,
          itemName: 'Sample item',
          prepTime: '123',
          totalOrders: 0,
        });
      }
    });

    if (!data.longestPrepTimeItems.length) {
      data.longestPrepTimeItems.push({
        itemName: 'Sample item',
        prepTime: '123',
        stationName: 'Sample station',
      });
    }

    return {
      message: 'Efficiency report generated successfully',
      data,
    };
  }
}
