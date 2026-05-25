import { Module } from '@nestjs/common';
import { PricingAdjustmentService } from './pricing-adjustment.service';
import { PricingAdjustmentController } from './pricing-adjustment.controller';

@Module({
  providers: [PricingAdjustmentService],
  controllers: [PricingAdjustmentController],
})
export class PricingAdjustmentModule {}
