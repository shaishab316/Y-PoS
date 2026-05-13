import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentQueryDto } from './payment.dto';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async getAllPayments(@Query() query: PaymentQueryDto): Promise<ApiResponse> {
    const [data, total] = await this.paymentService.getAllPayments(query);

    return {
      success: true,
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
  async getPaymentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<any>> {
    const data = await this.paymentService.getPaymentById(id);

    if (!data) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      data,
    };
  }
}
