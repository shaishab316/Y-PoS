import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CreateAdditionalPricingAdjustmentDto,
  UpdateAdditionalPricingAdjustmentDto,
  AdditionalPricingAdjustmentQueryDto,
} from './additional-pricing-adjustment.dto';

@Injectable()
export class AdditionalPricingAdjustmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createAdditionalPricingAdjustment(
    data: CreateAdditionalPricingAdjustmentDto,
  ) {
    return await this.prisma.additionalPricingAdjustment.create({
      data: {
        level: data.level,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount,
        type: data.type,
      },
    });
  }

  async getAllAdditionalPricingAdjustments({
    page,
    limit,
    search,
    type,
  }: AdditionalPricingAdjustmentQueryDto) {
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
      this.prisma.additionalPricingAdjustment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.additionalPricingAdjustment.count({ where }),
    ]);
  }

  async getAdditionalPricingAdjustmentById(id: number) {
    const pricingAdjustment =
      await this.prisma.additionalPricingAdjustment.findUnique({
        where: { id },
      });

    if (!pricingAdjustment) {
      throw new NotFoundException(
        `Additional pricing adjustment with ID ${id} not found`,
      );
    }

    return pricingAdjustment;
  }

  async updateAdditionalPricingAdjustment(
    id: number,
    data: UpdateAdditionalPricingAdjustmentDto,
  ) {
    // Verify pricing adjustment exists
    await this.getAdditionalPricingAdjustmentById(id);

    return this.prisma.additionalPricingAdjustment.update({
      where: { id },
      data: {
        level: data.level,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount,
        type: data.type,
      },
    });
  }

  async deleteAdditionalPricingAdjustment(id: number) {
    // Verify pricing adjustment exists
    await this.getAdditionalPricingAdjustmentById(id);

    return this.prisma.additionalPricingAdjustment.delete({
      where: { id },
    });
  }
}
