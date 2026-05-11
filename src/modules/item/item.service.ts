import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
}
