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
import { CreateItemDto, ItemQueryDto, UpdateItemDto } from './item.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import { createFileUploadInterceptor } from '@/infra/upload/interceptors/file-upload.interceptor';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { ParseJsonBodyInterceptor } from '@/common/interceptors/parse-json-body.interceptor';

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

@Controller('item')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  @InvalidateCache('item:all*')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ImageUploadInterceptor, ParseJsonBodyInterceptor)
  async createItem(
    @Body() body: CreateItemDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
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

    return {
      message: 'Item created successfully',
      data,
    };
  }

  @Get()
  @CacheKey('item:all')
  @CacheTTL(60 * 60) // 1 hour
  async getAllItems(@Query() query: ItemQueryDto) {
    const result = await this.itemService.getAllItems(query);

    return {
      message: 'Items retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @CacheKey('item::params.id')
  @CacheTTL(60 * 60) // 1 hour
  async getItemDetails(@Param('id', ParseIntPipe) id: number) {
    const item = await this.itemService.getItemDetails(id);

    return {
      message: 'Item details retrieved successfully',
      data: item,
    };
  }

  @Patch(':id')
  @InvalidateCache('item:all*', 'item::params.id')
  @UseInterceptors(ImageUploadInterceptor, ParseJsonBodyInterceptor)
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateItemDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
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

    return {
      message: 'Item updated successfully',
      data,
    };
  }

  @Delete(':id')
  @InvalidateCache('item:all*', 'item::params.id')
  @HttpCode(HttpStatus.OK)
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    await this.itemService.deleteItem(id);

    return {
      message: 'Item deleted successfully',
    };
  }
}
