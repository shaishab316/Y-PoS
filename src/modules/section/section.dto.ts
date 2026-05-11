import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { Layout } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateSectionSchema = z.object({
  name: _.name({ field: 'Section name' }),
  layout: z.enum(Layout).default(Layout.SINGLE),
  menuId: z.number().int(),
  sortOrder: z.number().int().optional(),
});

export const UpdateSectionSchema = CreateSectionSchema.partial();

export class CreateSectionDto extends createZodDto(CreateSectionSchema) {}
export class UpdateSectionDto extends createZodDto(UpdateSectionSchema) {}
