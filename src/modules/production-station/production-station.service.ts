import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CreateProductionStationDto,
  UpdateProductionStationDto,
  ProductionStationQueryDto,
} from './production-station.dto';
import { ProductionStation, Prisma } from '@prisma/client';

@Injectable()
export class ProductionStationService {
  constructor(private readonly prisma: PrismaService) {}

  async createProductionStation(data: CreateProductionStationDto) {
    const station = await this.prisma.productionStation.create({ data });

    return this.prisma.productionStation.update({
      where: { id: station.id },
      data: {
        slug: `ps-${station.id.toString().padStart(5, '0')}`,
        sortOrder: data.sortOrder ?? station.id,
      },
    });
  }

  async getAllProductionStations({ page, limit }: ProductionStationQueryDto) {
    return await Promise.all([
      this.prisma.productionStation.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.productionStation.count(),
    ]);
  }

  async getProductionStationDetails(id: number) {
    return await this.prisma.productionStation.findUnique({
      where: { id },
    });
  }

  async updateProductionStation(id: number, data: UpdateProductionStationDto) {
    const existingStation = await this.getProductionStationDetails(id);

    if (!existingStation) {
      throw new NotFoundException(`Production Station with ID ${id} not found`);
    }

    const payload = {} as Prisma.ProductionStationUpdateArgs['data'];

    if (data.name !== undefined) payload.name = data.name;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;

    const station = await this.prisma.productionStation.update({
      where: { id },
      data: payload,
    });

    return station;
  }

  async deleteProductionStation(id: number): Promise<ProductionStation> {
    const existingStation = await this.getProductionStationDetails(id);

    if (!existingStation) {
      throw new NotFoundException(`Production Station with ID ${id} not found`);
    }

    return await this.prisma.productionStation.delete({
      where: { id },
    });
  }
}
