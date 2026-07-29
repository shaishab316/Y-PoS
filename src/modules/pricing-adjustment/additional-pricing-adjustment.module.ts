import { Module } from '@nestjs/common';
import { AdditionalPricingAdjustmentService } from './additional-pricing-adjustment.service';
import { AdditionalPricingAdjustmentController } from './additional-pricing-adjustment.controller';

@Module({
  providers: [AdditionalPricingAdjustmentService],
  controllers: [AdditionalPricingAdjustmentController],
})
export class AdditionalPricingAdjustmentModule {}
