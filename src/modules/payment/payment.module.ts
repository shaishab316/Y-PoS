import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, CloudinaryService],
})
export class PaymentModule {}
