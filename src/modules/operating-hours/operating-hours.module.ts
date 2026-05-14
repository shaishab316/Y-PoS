import { Module } from '@nestjs/common';
import { OperatingHoursService } from './operating-hours.service';
import { OperatingHoursController } from './operating-hours.controller';

@Module({
  providers: [OperatingHoursService],
  controllers: [OperatingHoursController],
})
export class OperatingHoursModule {}
