import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderListener } from './order.listener';
import { ReceiptGeneratorService } from './services/receipt-generator.service';
import { ReceiptService } from './services/receipt.service';
import { UserModule } from '@/modules/user/user.module';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';

@Module({
  imports: [UserModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderListener,
    ReceiptGeneratorService,
    ReceiptService,
    CloudinaryService,
  ],
})
export class OrderModule {}
