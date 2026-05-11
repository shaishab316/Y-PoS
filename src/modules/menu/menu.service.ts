import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CreateMenuDto, UpdateMenuDto } from './menu.dto';
import { Menu, Prisma } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async createMenu(data: CreateMenuDto) {
    const menu = await this.prisma.menu.create({ data });

    return this.prisma.menu.update({
      where: { id: menu.id },
      data: {
        slug: `m-${menu.id.toString().padStart(3, '0')}`,
        sortOrder: data.sortOrder ?? menu.id,
      },
    });
  }

  async getAllMenus() {
    return await this.prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getMenuDetails(id: number) {
    return await this.prisma.menu.findUnique({
      where: { id },
    });
  }

  async updateMenu(id: number, data: UpdateMenuDto) {
    const existingMenu = await this.getMenuDetails(id);

    if (!existingMenu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    const payload = {} as Prisma.MenuUpdateArgs['data'];

    if (data.name) payload.name = data.name;
    if (data.isVisible !== undefined) payload.isVisible = data.isVisible;
    if (data.visibleOnQrTable !== undefined)
      payload.visibleOnQrTable = data.visibleOnQrTable;
    if (data.visibleOnTouchscreen !== undefined)
      payload.visibleOnTouchscreen = data.visibleOnTouchscreen;
    if (data.visibleOnService !== undefined)
      payload.visibleOnService = data.visibleOnService;
    if (data.visibleOnAdmin !== undefined)
      payload.visibleOnAdmin = data.visibleOnAdmin;
    if (data.orientationKiosk) payload.orientationKiosk = data.orientationKiosk;
    if (data.orientationService)
      payload.orientationService = data.orientationService;
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;

    const menu = await this.prisma.menu.update({
      where: { id },
      data: payload,
    });

    return menu;
  }

  async deleteMenu(id: number): Promise<Menu> {
    const existingMenu = await this.getMenuDetails(id);

    if (!existingMenu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    return await this.prisma.menu.delete({
      where: { id },
    });
  }
}
