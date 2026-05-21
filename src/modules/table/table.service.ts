import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TableQueryDto } from './table.dto';

@Injectable()
export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  async createTable(data: Prisma.TableCreateArgs['data']) {
    const table = await this.prisma.table.create({
      data,
    });

    return this.prisma.table.update({
      where: { id: table.id },
      data: {
        slug: `t-${table.id.toString().padStart(5, '0')}`,
      },
    });
  }

  async updateTable(id: number, data: Prisma.TableUpdateArgs['data']) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`Table with id ${id} not found`);
    }

    return this.prisma.table.update({
      where: { id },
      data,
    });
  }

  async deleteTable(id: number) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`Table with id ${id} not found`);
    }

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async getAllTables({ page, limit, search }: TableQueryDto) {
    const where: Prisma.TableWhereInput = {};

    if (search) {
      where.OR = [
        { tableNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await Promise.all([
      this.prisma.table.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.table.count({ where }),
    ]);
  }

  async getTableDetails(id: number) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with id ${id} not found`);
    }

    return table;
  }
}
