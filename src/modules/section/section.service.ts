import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  SectionQueryDto,
  AddItemToSectionDto,
  UpdateSectionItemSortDto,
} from './section.dto';
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

  async getAllSections({ page, limit, menuId }: SectionQueryDto) {
    const where: Prisma.SectionWhereInput = menuId ? { menuId } : {};

    return await Promise.all([
      this.prisma.section.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.section.count({ where }),
    ]);
  }

  async getSectionDetails(id: number) {
    return await this.prisma.section.findUnique({
      where: { id },
      include: {
        menu: true,
        sectionItems: {
          select: {
            item: {
              include: {
                packetSections: {
                  include: {
                    choices: {
                      include: {
                        item: true,
                      },
                    },
                  },
                },
                productionStation: true,
              },
            },
          },
        },
      },
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

  async bulkUpdateVisibility(
    sections: Array<{ id: number; [key: string]: any }>,
  ) {
    // Validate all sections exist
    const sectionIds = sections.map((s) => s.id);
    const existingSections = await this.prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingSections.map((s) => s.id));
    const missingIds = sectionIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Sections with IDs ${missingIds.join(', ')} not found`,
      );
    }

    const updates = sections.map((section) => {
      const { id, ...visibilityData } = section;

      const payload = {} as Prisma.SectionUpdateArgs['data'];

      if (visibilityData.isVisible !== undefined)
        payload.isVisible = visibilityData.isVisible;
      if (visibilityData.visibleOnQrTable !== undefined)
        payload.visibleOnQrTable = visibilityData.visibleOnQrTable;
      if (visibilityData.visibleOnTouchscreen !== undefined)
        payload.visibleOnTouchscreen = visibilityData.visibleOnTouchscreen;
      if (visibilityData.visibleOnService !== undefined)
        payload.visibleOnService = visibilityData.visibleOnService;
      if (visibilityData.visibleOnAdmin !== undefined)
        payload.visibleOnAdmin = visibilityData.visibleOnAdmin;
      if (visibilityData.orientationKiosk !== undefined)
        payload.orientationKiosk = visibilityData.orientationKiosk;
      if (visibilityData.orientationService !== undefined)
        payload.orientationService = visibilityData.orientationService;

      return this.prisma.section.update({
        where: { id },
        data: payload,
      });
    });

    return await Promise.all(updates);
  }

  async addItemToSection(sectionId: number, data: AddItemToSectionDto) {
    // Verify section exists
    const section = await this.getSectionDetails(sectionId);
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Verify item exists
    const item = await this.prisma.item.findUnique({
      where: { id: data.itemId },
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${data.itemId} not found`);
    }

    // Create section item link
    const sectionItem = await this.prisma.sectionItem.create({
      data: {
        sectionId,
        itemId: data.itemId,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        item: true,
      },
    });

    return sectionItem;
  }

  async removeItemFromSection(sectionId: number, itemId: number) {
    // Verify section exists
    const section = await this.getSectionDetails(sectionId);
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Find and delete the section item
    const sectionItem = await this.prisma.sectionItem.findFirst({
      where: {
        sectionId,
        itemId,
      },
    });

    if (!sectionItem) {
      throw new NotFoundException(
        `Item ${itemId} is not linked to section ${sectionId}`,
      );
    }

    return await this.prisma.sectionItem.delete({
      where: { id: sectionItem.id },
    });
  }

  async updateSectionItemSort(
    sectionId: number,
    itemId: number,
    data: UpdateSectionItemSortDto,
  ) {
    // Verify section exists
    const section = await this.getSectionDetails(sectionId);
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Find the section item
    const sectionItem = await this.prisma.sectionItem.findFirst({
      where: {
        sectionId,
        itemId,
      },
    });

    if (!sectionItem) {
      throw new NotFoundException(
        `Item ${itemId} is not linked to section ${sectionId}`,
      );
    }

    // Update sort order
    return await this.prisma.sectionItem.update({
      where: { id: sectionItem.id },
      data: {
        sortOrder: data.sortOrder,
      },
      include: {
        item: true,
      },
    });
  }
}
