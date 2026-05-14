import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';

@Module({
  providers: [ShiftService, CloudinaryService],
  controllers: [ShiftController],
})
export class ShiftModule {}
