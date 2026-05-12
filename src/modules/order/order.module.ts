import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderListener } from './order.listener';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderListener],
})
export class OrderModule {}
