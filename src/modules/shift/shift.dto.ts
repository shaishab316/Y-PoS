import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const OpenShiftSchema = z.object({
  userId: z.number().int().positive('Invalid user ID'),
});

export class OpenShiftDto extends createZodDto(OpenShiftSchema) {}

export const CloseShiftSchema = z.object({
  openingCashAmount: z.coerce.number().optional(),
  closingCashAmount: z.coerce
    .number()
    .min(0, 'Closing cash amount must be non-negative')
    .optional(),
  inventoryAccurate: z.boolean().optional(),
  promotionConfirmed: z.boolean().optional(),
  salesConfirmed: z.boolean().optional(),
  skippedInventory: z.boolean().optional().default(false),
  skippedPromotion: z.boolean().optional().default(false),
  skippedCash: z.boolean().optional().default(false),
});

export class CloseShiftDto extends createZodDto(CloseShiftSchema) {}

export const VerifyCashProofSchema = z.object({
  verifiedById: z.number().int().positive('Invalid user ID'),
});

export class VerifyCashProofDto extends createZodDto(VerifyCashProofSchema) {}
