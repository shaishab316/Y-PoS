import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './item.dto';
import { InvalidateCache } from '@/common/decorators/cache.decorator';
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
  @InvalidateCache('item:all')
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
}
