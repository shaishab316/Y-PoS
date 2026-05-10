import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto } from './menu.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMenu(@Body() body: CreateMenuDto) {
    const data = await this.menuService.createMenu(body);

    return {
      message: 'Menu created successfully',
      data,
    };
  }

  @Get()
  async getAllMenus() {
    const data = await this.menuService.getAllMenus();

    return {
      message: 'Menus fetched successfully',
      data,
    };
  }

  @Get(':id')
  async getMenuDetails(@Param('id') id: number) {
    const data = await this.menuService.getMenuDetails(id);

    return {
      message: 'Menu details fetched successfully',
      data,
    };
  }

  @Patch(':id')
  async updateMenu(@Param('id') id: number, @Body() body: UpdateMenuDto) {
    const data = await this.menuService.updateMenu(id, body);

    return {
      message: 'Menu updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMenu(@Param('id') id: number) {
    const data = await this.menuService.deleteMenu(id);

    return {
      message: 'Menu deleted successfully',
      data,
    };
  }
}
