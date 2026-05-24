import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderDto,
  SubmitPaymentDto,
  PaginationQueryDto,
  OrderProductionQueryDto,
  GetUserActiveOrdersDto,
} from './order.dto';
import {
  InvalidateCache,
  CacheKey,
  CacheTTL,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';
import { createFileUploadInterceptor } from '@/infra/upload/interceptors/file-upload.interceptor';
import { ParseJsonBodyInterceptor } from '@/common/interceptors/parse-json-body.interceptor';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';

const ProofImagesUploadInterceptor = createFileUploadInterceptor({
  fields: [
    {
      name: 'proofImages',
      maxCount: 10,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ],
});

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() body: CreateOrderDto): Promise<ApiResponse> {
    const data = await this.orderService.createOrder(body);

    return { message: 'Order created successfully', data };
  }

  @Post(':id/payment')
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ProofImagesUploadInterceptor, ParseJsonBodyInterceptor)
  async submitOrderPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SubmitPaymentDto,
    @UploadedFiles() files: { proofImages?: Express.Multer.File[] },
  ): Promise<ApiResponse> {
    const payload = {
      ...body,
      proofImages: [],
    };

    if (files.proofImages?.length) {
      const uploaded = await this.cloudinary.uploadFiles(
        files.proofImages,
        'proof-images',
        'image',
      );

      payload.proofImages = uploaded.map((u) => u.url) as any;
    }

    const data = await this.orderService.submitOrderPayment(id, payload);

    return { message: 'Payment submitted successfully', data };
  }

  @Get()
  @CacheKey('order:all')
  @CacheTTL(60)
  async getAllOrders(@Query() query: OrderQueryDto): Promise<ApiResponse> {
    const [data, total] = await this.orderService.getAllOrders(query);

    return {
      message: 'Orders retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('active')
  @CacheKey('order:active::query.userId')
  @CacheTTL(60)
  async gerUserActiveOrders(
    @Query() query: GetUserActiveOrdersDto,
  ): Promise<ApiResponse> {
    const [data, total] = await this.orderService.gerUserActiveOrders(query);

    return {
      message: 'Orders retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('production')
  @CacheKey('order:all-production')
  @CacheTTL(60)
  async getAllProductionOrders(
    @Query() query: OrderProductionQueryDto,
  ): Promise<ApiResponse> {
    const [data, total] = await this.orderService.getAllProductionOrders(query);

    return {
      message: 'Orders retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('pending-payment')
  @CacheKey('order:pending-payment')
  @CacheTTL(30)
  async getPendingPaymentOrders(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse> {
    const [data, total] =
      await this.orderService.getPendingPaymentOrders(query);

    return {
      message: 'Pending payment orders retrieved successfully',
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
  @CacheKey('order::params.id')
  @CacheTTL(60)
  async getOrderById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.orderService.getOrderById(id);

    return { message: 'Order retrieved successfully', data };
  }

  @Patch(':id')
  @InvalidateCache('order:*')
  async editOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderDto,
  ): Promise<ApiResponse> {
    const data = await this.orderService.editOrder(id, body);

    return { message: 'Order edited successfully', data };
  }

  @Patch(':id/cancel')
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.orderService.cancelOrder(id);

    return { message: 'Order cancelled successfully', data };
  }

  @Post(':id/send-to-production')
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.OK)
  async sendOrderToProduction(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.orderService.sendOrderToProduction(id);

    return { message: 'Order sent to production successfully', data };
  }

  @Patch(':id/accept')
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.OK)
  async acceptOrder(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.orderService.acceptOrder(id);

    return { message: 'Order accepted successfully', data };
  }

  @Patch(':id/ready')
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.OK)
  async markOrderReady(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.orderService.markOrderReady(id);

    return { message: 'Order marked as ready successfully', data };
  }

  @Patch(':id/pickup')
  @InvalidateCache('order:*')
  @HttpCode(HttpStatus.OK)
  async markOrderPickedUp(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.orderService.markOrderPickedUp(id);

    return { message: 'Order marked as picked up successfully', data };
  }
}
