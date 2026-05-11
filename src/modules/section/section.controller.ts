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
  Query,
} from '@nestjs/common';
import { SectionService } from './section.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  BulkUpdateSectionVisibilityDto,
} from './section.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @InvalidateCache('section:all*')
  @HttpCode(HttpStatus.CREATED)
  async createSection(@Body() body: CreateSectionDto): Promise<ApiResponse> {
    const data = await this.sectionService.createSection(body);

    return {
      message: 'Section created successfully',
      data,
    };
  }

  @Get()
  @CacheKey('section:all')
  @CacheTTL(60 * 60) // 1 hour
  async getAllSections(
    @Query('menuId', new ParseIntPipe({ optional: true })) menuId?: number,
  ): Promise<ApiResponse> {
    const data = await this.sectionService.getAllSections(menuId);

    return {
      message: 'Sections fetched successfully',
      data,
    };
  }

  @Patch('visibility/bulk')
  @InvalidateCache('section:all*', 'section::params.id')
  @HttpCode(HttpStatus.OK)
  async bulkUpdateVisibility(
    @Body() body: BulkUpdateSectionVisibilityDto,
  ): Promise<ApiResponse> {
    const data = await this.sectionService.bulkUpdateVisibility(body.sections);

    return {
      message: `${data.length} section(s) visibility updated successfully`,
      data,
    };
  }

  @Get(':id')
  @CacheKey('section::params.id')
  @CacheTTL(60 * 60) // 1 hour
  async getSectionDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.sectionService.getSectionDetails(id);

    return {
      message: 'Section details fetched successfully',
      data,
    };
  }

  @Patch(':id')
  @InvalidateCache('section:all*', 'section::params.id')
  @HttpCode(HttpStatus.OK)
  async updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSectionDto,
  ): Promise<ApiResponse> {
    const data = await this.sectionService.updateSection(id, body);

    return {
      message: 'Section updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('section:all*', 'section::params.id')
  @HttpCode(HttpStatus.OK)
  async deleteSection(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.sectionService.deleteSection(id);

    return {
      message: 'Section deleted successfully',
      data,
    };
  }
}
