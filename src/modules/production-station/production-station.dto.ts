import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateProductionStationSchema = z.object({
  name: _.name({ field: 'Production Station name' }),
  isActive: _.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

export const UpdateProductionStationSchema =
  CreateProductionStationSchema.partial();

export class CreateProductionStationDto extends createZodDto(
  CreateProductionStationSchema,
) {}
export class UpdateProductionStationDto extends createZodDto(
  UpdateProductionStationSchema,
) {}
