import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CreatePricingAdjustmentDto,
  UpdatePricingAdjustmentDto,
  PricingAdjustmentQueryDto,
} from './pricing-adjustment.dto';

@Injectable()
export class PricingAdjustmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createPricingAdjustment(data: CreatePricingAdjustmentDto) {
    return await this.prisma.pricingAdjustment.create({
      data: {
        level: data.level,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount,
        type: data.type,
      },
    });
  }

  async getAllPricingAdjustments({
    page,
    limit,
    search,
    type,
  }: PricingAdjustmentQueryDto) {
    const where: any = {};

    if (search) {
      where.level = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    return Promise.all([
      this.prisma.pricingAdjustment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.pricingAdjustment.count({ where }),
    ]);
  }

  async getPricingAdjustmentById(id: number) {
    const pricingAdjustment = await this.prisma.pricingAdjustment.findUnique({
      where: { id },
    });

    if (!pricingAdjustment) {
      throw new NotFoundException(`Pricing adjustment with ID ${id} not found`);
    }

    return pricingAdjustment;
  }

  async updatePricingAdjustment(id: number, data: UpdatePricingAdjustmentDto) {
    // Verify pricing adjustment exists
    await this.getPricingAdjustmentById(id);

    return this.prisma.pricingAdjustment.update({
      where: { id },
      data: {
        level: data.level,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount,
        type: data.type,
      },
    });
  }

  async deletePricingAdjustment(id: number) {
    // Verify pricing adjustment exists
    await this.getPricingAdjustmentById(id);

    return this.prisma.pricingAdjustment.delete({
      where: { id },
    });
  }
}
