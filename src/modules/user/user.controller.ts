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
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserQueryDto,
  UserForShiftQueryDto,
  UpdateBusinessDto,
} from './user.dto';
import {
  CacheKey,
  CacheTTL,
  InvalidateCache,
} from '@/common/decorators/cache.decorator';
import { createFileUploadInterceptor } from '@/infra/upload/interceptors/file-upload.interceptor';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { ParseJsonBodyInterceptor } from '@/common/interceptors/parse-json-body.interceptor';
import type { ApiResponse } from '@/common/types/api-response';

const PhotoUploadInterceptor = createFileUploadInterceptor({
  fields: [
    {
      name: 'photo',
      maxCount: 1,
      maxFileSize: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ],
});

const LogoUploadInterceptor = createFileUploadInterceptor({
  fields: [
    {
      name: 'logo',
      maxCount: 1,
      maxFileSize: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ],
});

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  @InvalidateCache('user:all*')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(PhotoUploadInterceptor, ParseJsonBodyInterceptor)
  async createUser(
    @Body() body: CreateUserDto,
    @UploadedFiles() files: { photo?: Express.Multer.File[] },
  ): Promise<ApiResponse> {
    const userData: any = { ...body };

    if (files?.photo?.[0]) {
      const uploaded = await this.cloudinary.uploadFile({
        file: files.photo[0],
        folder: 'users',
        resourceType: 'image',
      });
      userData.photoUrl = uploaded.url;
    }

    const data = await this.userService.createUser(userData);

    return { message: 'User created successfully', data };
  }

  @Get()
  @CacheKey('user:all')
  @CacheTTL(60 * 60)
  async getAllUsers(@Query() query: UserQueryDto): Promise<ApiResponse> {
    const [data, total] = await this.userService.getAllUsers(query);

    return {
      message: 'Users retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('for-shift')
  @CacheKey('user:for-shift')
  @CacheTTL(60 * 60)
  async getAllUsersForShift(
    @Query() query: UserForShiftQueryDto,
  ): Promise<ApiResponse> {
    const [data, total] = await this.userService.getAllUsersForShift(query);

    return {
      message: 'Users retrieved successfully',
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Patch('business')
  @UseInterceptors(LogoUploadInterceptor, ParseJsonBodyInterceptor)
  async updateBusiness(
    @Body() body: UpdateBusinessDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[] },
  ) {
    const businessData: any = { ...body };

    if (files?.logo?.[0]) {
      const uploaded = await this.cloudinary.uploadFile({
        file: files.logo[0],
        folder: 'business-logos',
        resourceType: 'image',
      });
      businessData.logoUrl = uploaded.url;
    }

    const data = await this.userService.updateBusiness(businessData);

    return { message: 'Business updated successfully', data };
  }

  @Get('business')
  async getBusinessProfile() {
    const data = await this.userService.getBusinessProfile();

    return {
      message: 'Business profile retrieved successfully',
      data: {
        ...data,
        feedbackMsg: data?.customNote,
      },
    };
  }

  @Get('owner')
  async getOwner() {
    const data = await this.userService.getOwner();

    return {
      message: 'Owner retrieved successfully',
      data: {
        ...data,
        email: data?.businessEmail ?? data?.email,
      },
    };
  }

  @Get(':id')
  @CacheKey('user::params.id')
  @CacheTTL(60 * 60)
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.userService.getUserById(id);

    return { message: 'User retrieved successfully', data };
  }

  @Patch(':id')
  @InvalidateCache('user:*')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(PhotoUploadInterceptor, ParseJsonBodyInterceptor)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @UploadedFiles() files: { photo?: Express.Multer.File[] },
  ): Promise<ApiResponse> {
    const updateData: any = { ...body };

    if (files?.photo?.[0]) {
      const uploaded = await this.cloudinary.uploadFile({
        file: files.photo[0],
        folder: 'users',
        resourceType: 'image',
      });
      updateData.photoUrl = uploaded.url;
    }

    const data = await this.userService.updateUser(id, updateData);

    return { message: 'User updated successfully', data };
  }

  @Patch(':id/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ChangePasswordDto,
  ): Promise<ApiResponse> {
    await this.userService.changePassword(id, body);

    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  @InvalidateCache('user:*')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    const data = await this.userService.deleteUser(id);

    return { message: 'User deleted successfully', data };
  }
}
