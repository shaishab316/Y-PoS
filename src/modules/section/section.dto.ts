import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { Layout, Orientation } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateSectionSchema = z.object({
  name: _.name({ field: 'Section name' }),
  layout: z.enum(Layout).default(Layout.SINGLE),
  menuId: z.number().int(),
  sortOrder: z.number().int().optional(),
});

export const UpdateSectionSchema = CreateSectionSchema.partial();

export const UpdateSectionVisibilitySchema = z.object({
  isVisible: z.boolean().optional(),
  visibleOnQrTable: z.boolean().optional(),
  visibleOnTouchscreen: z.boolean().optional(),
  visibleOnService: z.boolean().optional(),
  visibleOnAdmin: z.boolean().optional(),
  orientationKiosk: z.enum(Orientation).optional(),
  orientationService: z.enum(Orientation).optional(),
});

export const BulkUpdateSectionVisibilitySchema = z.object({
  sections: z.array(
    z.object({
      id: z.number().int(),
      ...UpdateSectionVisibilitySchema.shape,
    }),
  ),
});

export const SectionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  menuId: z.coerce.number().int().optional(),
});

export class CreateSectionDto extends createZodDto(CreateSectionSchema) {}
export class UpdateSectionDto extends createZodDto(UpdateSectionSchema) {}
export class UpdateSectionVisibilityDto extends createZodDto(
  UpdateSectionVisibilitySchema,
) {}
export class BulkUpdateSectionVisibilityDto extends createZodDto(
  BulkUpdateSectionVisibilitySchema,
) {}
export class SectionQueryDto extends createZodDto(SectionQuerySchema) {}
