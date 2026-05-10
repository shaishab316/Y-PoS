import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { Orientation } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateMenuSchema = z.object({
  name: _.name({ field: 'Menu name' }),
  isVisible: _.boolean().optional().default(true),
  visibleOnQrTable: _.boolean().optional().default(true),
  visibleOnTouchscreen: _.boolean().optional().default(true),
  visibleOnService: _.boolean().optional().default(true),
  visibleOnAdmin: _.boolean().optional().default(true),
  orientationKiosk: z
    .enum(Orientation)
    .optional()
    .default(Orientation.LANDSCAPE),
  orientationService: z
    .enum(Orientation)
    .optional()
    .default(Orientation.PORTRAIT),
  sortOrder: z.number().int().optional().default(0),
});

export const UpdateMenuSchema = CreateMenuSchema.partial();

export class CreateMenuDto extends createZodDto(CreateMenuSchema) {}
export class UpdateMenuDto extends createZodDto(UpdateMenuSchema) {}
