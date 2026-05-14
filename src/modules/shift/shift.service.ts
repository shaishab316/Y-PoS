import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { OpenShiftDto, CloseShiftDto, VerifyCashProofDto } from './shift.dto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Open a new shift for a user
   * Starts the shift session with initial setup
   */
  async openShift(dto: OpenShiftDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has an active shift
    const activeShift = await this.prisma.shiftSession.findFirst({
      where: {
        userId: dto.userId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    if (activeShift) {
      throw new BadRequestException('User already has an active shift today');
    }

    // Create new shift session
    const shift = await this.prisma.shiftSession.create({
      data: {
        userId: dto.userId,
        type: 'OPENING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✅ Shift opened for user ${dto.userId}`);

    return {
      id: shift.id,
      userId: shift.userId,
      user: shift.user,
      type: shift.type,
      createdAt: shift.createdAt,
    };
  }

  /**
   * Close an active shift
   * Records closing cash amount and confirmations (manual verification)
   */
  async closeShift(shiftId: string, dto: CloseShiftDto) {
    // Find the shift
    const shift = await this.prisma.shiftSession.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Calculate discrepancy if both amounts provided
    let closingDiscrepancy: Decimal | null = null;
    if (
      dto.openingCashAmount !== undefined &&
      dto.closingCashAmount !== undefined
    ) {
      closingDiscrepancy = new Decimal(dto.closingCashAmount).minus(
        new Decimal(dto.openingCashAmount),
      );
    }

    // Update shift with closing information
    const updatedShift = await this.prisma.shiftSession.update({
      where: { id: shiftId },
      data: {
        type: 'CLOSING',
        openingCashAmount: dto.openingCashAmount
          ? new Decimal(dto.openingCashAmount)
          : shift.openingCashAmount,
        closingCashAmount: dto.closingCashAmount
          ? new Decimal(dto.closingCashAmount)
          : undefined,
        closingDiscrepancy,
        // Record manual confirmations (human verification)
        inventoryAccurate: dto.inventoryAccurate ?? shift.inventoryAccurate,
        promotionConfirmed: dto.promotionConfirmed ?? shift.promotionConfirmed,
        salesConfirmed: dto.salesConfirmed ?? shift.salesConfirmed,
        skippedInventory: dto.skippedInventory ?? shift.skippedInventory,
        skippedPromotion: dto.skippedPromotion ?? shift.skippedPromotion,
        skippedCash: dto.skippedCash ?? shift.skippedCash,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cashProofs: true,
      },
    });

    this.logger.log(`✅ Shift closed for user ${shift.userId}`);

    return {
      id: updatedShift.id,
      userId: updatedShift.userId,
      user: updatedShift.user,
      type: updatedShift.type,
      openingCashAmount: updatedShift.openingCashAmount?.toString(),
      closingCashAmount: updatedShift.closingCashAmount?.toString(),
      closingDiscrepancy: updatedShift.closingDiscrepancy?.toString(),
      inventoryAccurate: updatedShift.inventoryAccurate,
      promotionConfirmed: updatedShift.promotionConfirmed,
      salesConfirmed: updatedShift.salesConfirmed,
      cashProofsCount: updatedShift.cashProofs.length,
      createdAt: updatedShift.createdAt,
    };
  }

  /**
   * Get the currently active shift for a user
   */
  async getCurrentShift(userId: number) {
    const shift = await this.prisma.shiftSession.findFirst({
      where: {
        userId,
        type: 'OPENING', // Only get active (opening) shifts
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cashProofs: {
          select: {
            id: true,
            imageUrl: true,
            uploadedById: true,
            verifiedById: true,
            verifiedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('No active shift found for this user');
    }

    return this._formatShiftResponse(shift);
  }

  /**
   * Get shift details by ID
   */
  async getShiftById(shiftId: string) {
    const shift = await this.prisma.shiftSession.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cashProofs: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            verifiedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return this._formatShiftResponse(shift);
  }

  /**
   * Upload a cash proof image for a shift
   */
  async uploadCashProof(
    shiftId: string,
    file: Express.Multer.File,
    uploadedById: number,
  ) {
    // Verify shift exists
    const shift = await this.prisma.shiftSession.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: uploadedById },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload file to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile({
      file,
      folder: `shifts/${shiftId}/cash-proofs`,
      resourceType: 'image',
    });

    // Create cash proof record
    const cashProof = await this.prisma.cashProof.create({
      data: {
        shiftSessionId: shiftId,
        imageUrl: uploadResult.url,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✅ Cash proof uploaded for shift ${shiftId}`);

    return {
      id: cashProof.id,
      shiftSessionId: cashProof.shiftSessionId,
      imageUrl: cashProof.imageUrl,
      uploadedBy: cashProof.uploadedBy,
      verifiedAt: cashProof.verifiedAt,
      createdAt: cashProof.createdAt,
    };
  }

  /**
   * Verify a cash proof (manual verification by owner or admin)
   */
  async verifyCashProof(
    shiftId: string,
    proofId: string,
    dto: VerifyCashProofDto,
  ) {
    // Verify shift exists
    const shift = await this.prisma.shiftSession.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Verify cash proof exists
    const cashProof = await this.prisma.cashProof.findUnique({
      where: { id: proofId },
    });

    if (!cashProof) {
      throw new NotFoundException('Cash proof not found');
    }

    if (cashProof.shiftSessionId !== shiftId) {
      throw new BadRequestException('Cash proof does not belong to this shift');
    }

    // Verify user exists
    const verifier = await this.prisma.user.findUnique({
      where: { id: dto.verifiedById },
    });

    if (!verifier) {
      throw new NotFoundException('Verifier user not found');
    }

    // Update cash proof with verification
    const verifiedProof = await this.prisma.cashProof.update({
      where: { id: proofId },
      data: {
        verifiedById: dto.verifiedById,
        verifiedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✅ Cash proof verified for shift ${shiftId}`);

    return {
      id: verifiedProof.id,
      shiftSessionId: verifiedProof.shiftSessionId,
      imageUrl: verifiedProof.imageUrl,
      uploadedBy: verifiedProof.uploadedBy,
      verifiedBy: verifiedProof.verifiedBy,
      verifiedAt: verifiedProof.verifiedAt,
      createdAt: verifiedProof.createdAt,
    };
  }

  private _formatShiftResponse(shift: any) {
    return {
      id: shift.id,
      userId: shift.userId,
      user: shift.user,
      type: shift.type,
      openingCashAmount: shift.openingCashAmount?.toString(),
      closingCashAmount: shift.closingCashAmount?.toString(),
      closingDiscrepancy: shift.closingDiscrepancy?.toString(),
      inventoryAccurate: shift.inventoryAccurate,
      promotionConfirmed: shift.promotionConfirmed,
      salesConfirmed: shift.salesConfirmed,
      skippedInventory: shift.skippedInventory,
      skippedPromotion: shift.skippedPromotion,
      skippedCash: shift.skippedCash,
      cashProofs: shift.cashProofs?.map((proof: any) => ({
        id: proof.id,
        imageUrl: proof.imageUrl,
        uploadedBy: proof.uploadedBy,
        verifiedBy: proof.verifiedBy,
        verifiedAt: proof.verifiedAt,
        createdAt: proof.createdAt,
      })),
      createdAt: shift.createdAt,
    };
  }
}
