import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ItemQueryDto } from './item.dto';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(data: Prisma.ItemCreateArgs['data']) {
    const item = await this.prisma.item.create({
      data,
    });

    return this.prisma.item.update({
      where: { id: item.id },
      data: {
        slug: `i-${item.id.toString().padStart(5, '0')}`,
        sortOrder: data?.sortOrder ?? item.id,
      },
    });
  }

  async updateItem(id: number, data: Prisma.ItemUpdateArgs['data']) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    return this.prisma.item.update({
      where: { id },
      data,
    });
  }

  async deleteItem(id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    return this.prisma.item.delete({
      where: { id },
    });
  }

  async getAllItems({ page, limit }: ItemQueryDto) {
    return await Promise.all([
      this.prisma.item.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          sortOrder: 'asc',
        },
      }),
      this.prisma.item.count(),
    ]);
  }

  async getItemDetails(id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        productionStation: true,
        sectionItems: {
          include: {
            section: true,
          },
        },
        packetSections: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    return item;
  }
}
