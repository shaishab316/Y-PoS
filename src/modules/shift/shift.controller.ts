import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { OpenShiftDto, CloseShiftDto, VerifyCashProofDto } from './shift.dto';
import { createFileUploadInterceptor } from '@/infra/upload/interceptors/file-upload.interceptor';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import type { ApiResponse } from '@/common/types/api-response';

const CashProofUploadInterceptor = createFileUploadInterceptor({
  fields: [
    {
      name: 'cashProof',
      maxCount: 1,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ],
});

@Controller('shift')
export class ShiftController {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * POST /shift/open — start shift (opening checklist)
   * Opens a new shift session for a user
   */
  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  async openShift(@Body() dto: OpenShiftDto): Promise<ApiResponse> {
    const data = await this.shiftService.openShift(dto);

    return {
      success: true,
      message: 'Shift opened successfully',
      data,
    };
  }

  /**
   * POST /shift/close — end shift (closing checklist)
   * Closes an active shift and records all verifications
   */
  @Post('close')
  @HttpCode(HttpStatus.OK)
  async closeShift(
    @Query('shiftId') shiftId: string,
    @Body() dto: CloseShiftDto,
  ): Promise<ApiResponse> {
    if (!shiftId) {
      return {
        success: false,
        message: 'Shift ID is required in query parameters',
      };
    }

    const data = await this.shiftService.closeShift(shiftId, dto);

    return {
      success: true,
      message: 'Shift closed successfully',
      data,
    };
  }

  /**
   * GET /shift/current — get active shift
   * Returns the currently active shift for a user
   */
  @Get('current')
  async getCurrentShift(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ApiResponse> {
    const data = await this.shiftService.getCurrentShift(userId);

    return {
      success: true,
      message: 'Current shift retrieved successfully',
      data,
    };
  }

  /**
   * GET /shift/:id — get shift details
   * Returns full shift details including cash proofs and verifications
   */
  @Get(':id')
  async getShiftById(@Param('id') shiftId: string): Promise<ApiResponse> {
    const data = await this.shiftService.getShiftById(shiftId);

    return {
      success: true,
      message: 'Shift details retrieved successfully',
      data,
    };
  }

  /**
   * POST /shift/:id/cash-proof — upload cash proof image
   * Uploads a cash proof image for manual verification
   */
  @Post(':id/cash-proof')
  @UseInterceptors(CashProofUploadInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async uploadCashProof(
    @Param('id') shiftId: string,
    @UploadedFiles() files: { cashProof?: Express.Multer.File[] },
    @Query('uploadedById', ParseIntPipe) uploadedById: number,
  ): Promise<ApiResponse> {
    if (!files?.cashProof?.[0]) {
      return {
        success: false,
        message: 'Cash proof image is required',
      };
    }

    const data = await this.shiftService.uploadCashProof(
      shiftId,
      files.cashProof[0],
      uploadedById,
    );

    return {
      success: true,
      message: 'Cash proof uploaded successfully',
      data,
    };
  }

  /**
   * PATCH /shift/:id/cash-proof/:proofId/verify — verify cash proof
   * Marks a cash proof as verified by owner/admin (manual verification)
   */
  @Patch(':id/cash-proof/:proofId/verify')
  @HttpCode(HttpStatus.OK)
  async verifyCashProof(
    @Param('id') shiftId: string,
    @Param('proofId') proofId: string,
    @Body() dto: VerifyCashProofDto,
  ): Promise<ApiResponse> {
    const data = await this.shiftService.verifyCashProof(shiftId, proofId, dto);

    return {
      success: true,
      message: 'Cash proof verified successfully',
      data,
    };
  }
}
