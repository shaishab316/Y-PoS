import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  ParseIntPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Response,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentQueryDto, VerifyPaymentDto } from './payment.dto';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async getAllPayments(@Query() query: PaymentQueryDto): Promise<ApiResponse> {
    const [data, total] = await this.paymentService.getAllPayments(query);
    const meta = await this.paymentService.getPaymentMetrics();

    return {
      success: true,
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      meta,
    };
  }

  @Get('export/today')
  async exportTodayPayments(@Response() res: any) {
    const buffer = await this.paymentService.exportTodayPaymentsToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="today-payments-${new Date().toISOString().split('T')[0]}.xlsx"`,
    );
    res.send(buffer);
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

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: VerifyPaymentDto,
  ): Promise<ApiResponse> {
    const data = await this.paymentService.verifyPayment(
      id,
      body.verifiedById,
      body.cashReceived,
    );

    if (!data) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      message: 'Payment verified successfully',
      data,
    };
  }
}
