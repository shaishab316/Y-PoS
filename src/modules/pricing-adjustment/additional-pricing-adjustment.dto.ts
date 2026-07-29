import { PricingAdjustmentType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateAdditionalPricingAdjustmentSchema = z.object({
  level: z.string().max(255).optional(),
  percentage: z.coerce.number().optional(),
  fixedAmount: z.coerce.number().optional(),
  type: z.enum(PricingAdjustmentType).optional(),
});

export const UpdateAdditionalPricingAdjustmentSchema =
  CreateAdditionalPricingAdjustmentSchema.partial();

export const AdditionalPricingAdjustmentQuerySchema = z.object({
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(10),
  search: z.string().optional(),
  type: z.enum(PricingAdjustmentType).optional(),
});

export class CreateAdditionalPricingAdjustmentDto extends createZodDto(
  CreateAdditionalPricingAdjustmentSchema,
) {}
export class UpdateAdditionalPricingAdjustmentDto extends createZodDto(
  UpdateAdditionalPricingAdjustmentSchema,
) {}
export class AdditionalPricingAdjustmentQueryDto extends createZodDto(
  AdditionalPricingAdjustmentQuerySchema,
) {}
