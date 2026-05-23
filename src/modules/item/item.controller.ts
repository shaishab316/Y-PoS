import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ItemService } from './item.service';
import {
  CreateItemDto,
  CreatePacketSectionChoiceDto,
  CreatePacketSectionDto,
  ItemQueryDto,
  UpdateItemDto,
  UpdatePacketSectionChoiceDto,
  UpdatePacketSectionDto,
} from './item.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import { createFileUploadInterceptor } from '@/infra/upload/interceptors/file-upload.interceptor';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { ParseJsonBodyInterceptor } from '@/common/interceptors/parse-json-body.interceptor';
import type { ApiResponse } from '@/common/types/api-response';

const ImageUploadInterceptor = createFileUploadInterceptor({
  fields: [
    {
      name: 'image',
      maxCount: 1,
      maxFileSize: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ],
});

@Controller('items')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  @InvalidateCache('item:all*', 'menu:*')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ImageUploadInterceptor, ParseJsonBodyInterceptor)
  async createItem(
    @Body() body: CreateItemDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ): Promise<ApiResponse> {
    if (!files?.image?.[0]) {
      throw new BadRequestException('Image file is required');
    }

    const uploaded = await this.cloudinary.uploadFile({
      file: files.image[0],
      folder: 'items',
      resourceType: 'image',
    });

    const data = await this.itemService.createItem({
      ...body,
      imageUrl: uploaded.url,
    });

    return { message: 'Item created successfully', data };
  }

  @Get()
  @CacheKey('item:all')
  @CacheTTL(60 * 60)
  async getAllItems(@Query() query: ItemQueryDto): Promise<ApiResponse> {
    const [data, total] = await this.itemService.getAllItems(query);

    return {
      message: 'Items retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get(':id')
  @CacheKey('item::params.id')
  @CacheTTL(60 * 60)
  async getItemDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.itemService.getItemDetails(id);

    return { message: 'Item details retrieved successfully', data };
  }

  @Patch(':id')
  @InvalidateCache('item:all*', 'item::params.id', 'menu:*')
  @UseInterceptors(ImageUploadInterceptor, ParseJsonBodyInterceptor)
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateItemDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ): Promise<ApiResponse> {
    const updateData: any = { ...body };

    if (files?.image?.[0]) {
      const uploaded = await this.cloudinary.uploadFile({
        file: files.image[0],
        folder: 'items',
        resourceType: 'image',
      });
      updateData.imageUrl = uploaded.url;
    }

    const data = await this.itemService.updateItem(id, updateData);

    return { message: 'Item updated successfully', data };
  }

  @Delete(':id')
  @InvalidateCache('item:all*', 'item::params.id', 'menu:*')
  @HttpCode(HttpStatus.OK)
  async deleteItem(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    await this.itemService.deleteItem(id);

    return { message: 'Item deleted successfully' };
  }

  // Packet sections

  @Post(':id/packet-sections')
  @InvalidateCache('item:all*', 'item::params.id', 'menu:*')
  @HttpCode(HttpStatus.CREATED)
  async createPacketSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePacketSectionDto,
  ): Promise<ApiResponse> {
    const data = await this.itemService.createPacketSection(id, body);

    return { message: 'Packet section created successfully', data };
  }

  @Patch('packet-sections/:sectionId')
  @InvalidateCache('item:all*', 'menu:*')
  async updatePacketSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() body: UpdatePacketSectionDto,
  ): Promise<ApiResponse> {
    const data = await this.itemService.updatePacketSection(sectionId, body);

    return { message: 'Packet section updated successfully', data };
  }

  @Delete('packet-sections/:sectionId')
  @InvalidateCache('item:all*', 'menu:*')
  @HttpCode(HttpStatus.OK)
  async deletePacketSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<ApiResponse> {
    await this.itemService.deletePacketSection(sectionId);

    return { message: 'Packet section deleted successfully' };
  }

  // Packet section choices

  @Post('packet-sections/:sectionId/choices')
  @InvalidateCache('item:all*', 'menu:*')
  @HttpCode(HttpStatus.CREATED)
  async createPacketSectionChoice(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() body: CreatePacketSectionChoiceDto,
  ): Promise<ApiResponse> {
    const data = await this.itemService.createPacketSectionChoice(
      sectionId,
      body,
    );

    return { message: 'Choice created successfully', data };
  }

  @Patch('packet-sections/choices/:choiceId')
  @InvalidateCache('item:all*', 'menu:*')
  async updatePacketSectionChoice(
    @Param('choiceId', ParseIntPipe) choiceId: number,
    @Body() body: UpdatePacketSectionChoiceDto,
  ): Promise<ApiResponse> {
    const data = await this.itemService.updatePacketSectionChoice(
      choiceId,
      body,
    );

    return { message: 'Choice updated successfully', data };
  }

  @Delete('packet-sections/choices/:choiceId')
  @InvalidateCache('item:all*', 'menu:*')
  @HttpCode(HttpStatus.OK)
  async deletePacketSectionChoice(
    @Param('choiceId', ParseIntPipe) choiceId: number,
  ): Promise<ApiResponse> {
    await this.itemService.deletePacketSectionChoice(choiceId);

    return { message: 'Choice deleted successfully' };
  }
}
