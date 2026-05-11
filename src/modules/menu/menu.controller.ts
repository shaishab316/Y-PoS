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
  ParseIntPipe,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto } from './menu.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @InvalidateCache('menu:all')
  @HttpCode(HttpStatus.CREATED)
  async createMenu(@Body() body: CreateMenuDto): Promise<ApiResponse> {
    const data = await this.menuService.createMenu(body);

    return {
      message: 'Menu created successfully',
      data,
    };
  }

  @Get()
  @CacheKey('menu:all')
  @CacheTTL(60 * 60) // 1 hour
  async getAllMenus(): Promise<ApiResponse> {
    const data = await this.menuService.getAllMenus();

    return {
      message: 'Menus fetched successfully',
      data,
    };
  }

  @Get(':id')
  @CacheKey('menu::params.id')
  @CacheTTL(60 * 60) // 1 hour
  async getMenuDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.menuService.getMenuDetails(id);

    return {
      message: 'Menu details fetched successfully',
      data,
    };
  }

  @Patch(':id')
  @InvalidateCache('menu:all', 'menu::params.id')
  @HttpCode(HttpStatus.OK)
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMenuDto,
  ): Promise<ApiResponse> {
    const data = await this.menuService.updateMenu(id, body);

    return {
      message: 'Menu updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('menu:all', 'menu::params.id')
  @HttpCode(HttpStatus.OK)
  async deleteMenu(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.menuService.deleteMenu(id);

    return {
      message: 'Menu deleted successfully',
      data,
    };
  }
}
