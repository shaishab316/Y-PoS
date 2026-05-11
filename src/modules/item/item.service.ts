import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreatePacketSectionDto,
  CreatePacketSectionChoiceDto,
  ItemQueryDto,
  UpdatePacketSectionChoiceDto,
  UpdatePacketSectionDto,
} from './item.dto';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(data: Prisma.ItemCreateArgs['data']) {
    const item = await this.prisma.item.create({ data });

    return this.prisma.item.update({
      where: { id: item.id },
      data: {
        slug: `i-${item.id.toString().padStart(5, '0')}`,
        sortOrder: data?.sortOrder ?? item.id,
      },
    });
  }

  async getAllItems({ page, limit }: ItemQueryDto) {
    return Promise.all([
      this.prisma.item.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          productionStation: true,
          packetSections: {
            include: { choices: true },
          },
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
          include: { section: true },
        },
        packetSections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            choices: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundException(`Item with id ${id} not found`);

    return item;
  }

  async updateItem(id: number, data: Prisma.ItemUpdateArgs['data']) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Item with id ${id} not found`);

    return this.prisma.item.update({ where: { id }, data });
  }

  async deleteItem(id: number) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Item with id ${id} not found`);

    return this.prisma.item.delete({ where: { id } });
  }

  async createPacketSection(itemId: number, dto: CreatePacketSectionDto) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Item with id ${itemId} not found`);

    const section = await this.prisma.packetSection.create({
      data: { ...dto, itemId },
    });

    return this.prisma.packetSection.update({
      where: { id: section.id },
      data: {
        slug: `ps-${section.id.toString().padStart(5, '0')}`,
        sortOrder: dto.sortOrder ?? section.id,
      },
    });
  }

  async updatePacketSection(sectionId: number, dto: UpdatePacketSectionDto) {
    const section = await this.prisma.packetSection.findUnique({
      where: { id: sectionId },
    });
    if (!section)
      throw new NotFoundException(
        `Packet section with id ${sectionId} not found`,
      );

    return this.prisma.packetSection.update({
      where: { id: sectionId },
      data: dto,
    });
  }

  async deletePacketSection(sectionId: number) {
    const section = await this.prisma.packetSection.findUnique({
      where: { id: sectionId },
    });
    if (!section)
      throw new NotFoundException(
        `Packet section with id ${sectionId} not found`,
      );

    return this.prisma.packetSection.delete({ where: { id: sectionId } });
  }

  async createPacketSectionChoice(
    sectionId: number,
    dto: CreatePacketSectionChoiceDto,
  ) {
    const section = await this.prisma.packetSection.findUnique({
      where: { id: sectionId },
    });
    if (!section)
      throw new NotFoundException(
        `Packet section with id ${sectionId} not found`,
      );

    const choice = await this.prisma.packetSectionChoice.create({
      data: { ...dto, packetSectionId: sectionId },
    });

    return this.prisma.packetSectionChoice.update({
      where: { id: choice.id },
      data: {
        slug: `psc-${choice.id.toString().padStart(5, '0')}`,
        sortOrder: dto.sortOrder ?? choice.id,
      },
    });
  }

  async updatePacketSectionChoice(
    choiceId: number,
    dto: UpdatePacketSectionChoiceDto,
  ) {
    const choice = await this.prisma.packetSectionChoice.findUnique({
      where: { id: choiceId },
    });
    if (!choice)
      throw new NotFoundException(`Choice with id ${choiceId} not found`);

    return this.prisma.packetSectionChoice.update({
      where: { id: choiceId },
      data: dto,
    });
  }

  async deletePacketSectionChoice(choiceId: number) {
    const choice = await this.prisma.packetSectionChoice.findUnique({
      where: { id: choiceId },
    });

    if (!choice) {
      throw new NotFoundException(`Choice with id ${choiceId} not found`);
    }

    return this.prisma.packetSectionChoice.delete({ where: { id: choiceId } });
  }
}
