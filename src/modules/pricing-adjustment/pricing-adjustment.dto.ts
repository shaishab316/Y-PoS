import { PricingAdjustmentType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreatePricingAdjustmentSchema = z.object({
  level: z.string().max(255).optional(),
  percentage: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .optional(),
  fixedAmount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .optional(),
  type: z.enum(PricingAdjustmentType).optional(),
});

export const UpdatePricingAdjustmentSchema =
  CreatePricingAdjustmentSchema.partial();

export const PricingAdjustmentQuerySchema = z.object({
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(10),
  search: z.string().optional(),
  type: z.enum(PricingAdjustmentType).optional(),
});

export class CreatePricingAdjustmentDto extends createZodDto(
  CreatePricingAdjustmentSchema,
) {}
export class UpdatePricingAdjustmentDto extends createZodDto(
  UpdatePricingAdjustmentSchema,
) {}
export class PricingAdjustmentQueryDto extends createZodDto(
  PricingAdjustmentQuerySchema,
) {}
