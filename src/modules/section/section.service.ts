import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CreateSectionDto, UpdateSectionDto } from './section.dto';
import { Section, Prisma } from '@prisma/client';

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSection(data: CreateSectionDto) {
    const section = await this.prisma.section.create({ data });

    return this.prisma.section.update({
      where: { id: section.id },
      data: {
        slug: `sec-${section.id.toString().padStart(5, '0')}`,
        sortOrder: data.sortOrder ?? section.id,
      },
    });
  }

  async getAllSections(menuId?: number) {
    const where: Prisma.SectionWhereInput = menuId ? { menuId } : {};

    return await this.prisma.section.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getSectionDetails(id: number) {
    return await this.prisma.section.findUnique({
      where: { id },
    });
  }

  async updateSection(id: number, data: UpdateSectionDto) {
    const existingSection = await this.getSectionDetails(id);

    if (!existingSection) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    const payload = {} as Prisma.SectionUpdateArgs['data'];

    if (data.name !== undefined) payload.name = data.name;
    if (data.layout !== undefined) payload.layout = data.layout;
    if (data.menuId !== undefined) payload.menuId = data.menuId;
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;

    return await this.prisma.section.update({
      where: { id },
      data: payload,
    });
  }

  async deleteSection(id: number): Promise<Section> {
    const existingSection = await this.getSectionDetails(id);

    if (!existingSection) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return await this.prisma.section.delete({
      where: { id },
    });
  }
}
