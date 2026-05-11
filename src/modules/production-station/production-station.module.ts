import { Module } from '@nestjs/common';
import { ProductionStationService } from './production-station.service';
import { ProductionStationController } from './production-station.controller';

@Module({
  controllers: [ProductionStationController],
  providers: [ProductionStationService],
})
export class ProductionStationModule {}
