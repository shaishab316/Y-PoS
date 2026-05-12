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
import { OrderService } from './order.service';
import { CreateOrderDto, OrderQueryDto, UpdateOrderDto } from './order.dto';
import {
  InvalidateCache,
  CacheKey,
  CacheTTL,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @InvalidateCache('order:all*')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() body: CreateOrderDto): Promise<ApiResponse> {
    const data = await this.orderService.createOrder(body);

    return { message: 'Order created successfully', data };
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
  @InvalidateCache('order:all*', 'order::params.id')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderDto,
  ): Promise<ApiResponse> {
    const data = await this.orderService.updateOrder(id, body);

    return { message: 'Order updated successfully', data };
  }

  @Delete(':id/items/:itemId')
  @InvalidateCache('order:all*', 'order::params.id')
  @HttpCode(HttpStatus.OK)
  async cancelOrderItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId') itemId: string,
  ): Promise<ApiResponse> {
    const data = await this.orderService.cancelOrderItem(id, itemId);

    return { message: 'Order item cancelled successfully', data };
  }
}
