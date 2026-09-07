import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  ParseIntPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Response,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  PaymentQueryDto,
  VerifyPaymentDto,
  TodayPaymentVerifyDto,
  UpdatePaymentVerificationStatusDto,
  DateRangeQueryDto,
} from './payment.dto';
import type { ApiResponse } from '@/common/types/api-response';
import { createFileUploadInterceptor } from '@/infra/upload/interceptors/file-upload.interceptor';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { ParseJsonBodyInterceptor } from '@/common/interceptors/parse-json-body.interceptor';
import { EventEmitter2 } from '@nestjs/event-emitter';

const ProofImagesUploadInterceptor = createFileUploadInterceptor({
  fields: [
    {
      name: 'proofImages',
      maxCount: 5,
      maxFileSize: 15 * 1024 * 1024, // 15 MB
      allowedMimeTypes: ['*'],
    },
    {
      name: 'cashDeposit',
      maxCount: 5,
      maxFileSize: 15 * 1024 * 1024, // 15 MB
      allowedMimeTypes: ['*'],
    },
  ],
});

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  @Post('today/verify')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ProofImagesUploadInterceptor, ParseJsonBodyInterceptor)
  async todayPaymentVerify(
    @Body() body: TodayPaymentVerifyDto,
    @UploadedFiles()
    files: {
      proofImages?: Express.Multer.File[];
      cashDeposit?: Express.Multer.File[];
    },
  ): Promise<ApiResponse> {
    let proofImageUrls: string[] = [];
    let cashDepositUrls: string[] = [];

    if (files?.proofImages?.length) {
      const uploaded = await this.cloudinary.uploadFiles(
        files.proofImages,
        'payment-verify',
        'image',
      );
      proofImageUrls = uploaded.map((u) => u.url);
    }

    if (files?.cashDeposit?.length) {
      const uploaded = await this.cloudinary.uploadFiles(
        files.cashDeposit,
        'payment-verify',
        'image',
      );
      cashDepositUrls = uploaded.map((u) => u.url);
    }

    console.log('Proof image URLs:', proofImageUrls);
    console.log('CashDeposit image URLs:', cashDepositUrls);
    console.log('Request body:', body);

    const data = await this.paymentService.createTodayPaymentVerify({
      totalSales: body.totalSales ?? null,
      actualSales: body.actualSales ?? null,
      remark: body.remark ?? null,
      proofImages: proofImageUrls,
      verifiedById: body.verifiedById,
      openingCash: body.openingCash ?? null,
      cashIn: body.cashIn ?? null,
      totalOpeningCash: body.totalOpeningCash ?? null,
      incomeCash: body.incomeCash ?? null,
      actualIncomeCash: body.actualIncomeCash ?? null,
      incomeTransfer: body.incomeTransfer ?? null,
      actualTransfer: body.actualTransfer ?? null,
      expensesCash: body.expensesCash ?? null,
      expenseRemark: body.expenseRemark ?? null,
      cashDeposit: body.cashDeposit ?? [],
      closingCash: body.closingCash ?? null,
      deposit: body.deposit ?? null,
    });

    this.eventEmitter.emit('todayPaymentVerify', data);

    const whatsappUrl = await this.paymentService.getWhatsAppUrlForVerification(
      body,
      proofImageUrls,
      cashDepositUrls,
    );

    return {
      success: true,
      message: 'Payment verification record created successfully',
      data: {
        ...data,
        whatsappUrl,
      },
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

  @Patch(':id/verification-status')
  @HttpCode(HttpStatus.OK)
  async updateVerificationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePaymentVerificationStatusDto,
  ): Promise<ApiResponse> {
    const data = await this.paymentService.updateVerificationStatus(id, body);

    if (!data) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      message: 'Payment verification status updated successfully',
      data,
    };
  }

  @Get('today/summary')
  async getTodayPayments(
    @Query() query: DateRangeQueryDto,
  ): Promise<ApiResponse> {
    const data = await this.paymentService.getTodayPaymentsSummary(query);

    return {
      success: true,
      data,
    };
  }
}
