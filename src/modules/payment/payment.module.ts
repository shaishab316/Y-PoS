import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { PaymentListener } from './payment.listener';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, CloudinaryService, PaymentListener],
})
export class PaymentModule {}
