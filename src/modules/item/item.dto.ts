import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { ItemType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ItemLabel } from './item.constant';

export const CreateItemSchema = z.object({
  name: _.name({ field: 'Item name' }),
  slug: _.name({ field: 'Item id' }).optional(),
  itemType: z.enum(ItemType).default(ItemType.INDIVIDUAL),
  price: z.number().int().min(0).optional().default(0),
  productionStationId: z.number().int().optional(),
  inventoryQty: z.number().int().optional(),
  labels: z.array(z.enum(ItemLabel)).optional(),
  isVisible: z.boolean().optional().default(true),
  isOutOfStock: z.boolean().optional().default(false),
  hasPromo: z.boolean().optional().default(false),
  promoName: z.string().max(100).optional(),
  promoPrice: z.number().int().min(0).optional(),
  // maxPacketItems: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export class CreateItemDto extends createZodDto(CreateItemSchema) {}
export class UpdateItemDto extends createZodDto(UpdateItemSchema) {}

export const ItemQuerySchema = z.object({
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(10),
  search: z.string().optional(),
});

export class ItemQueryDto extends createZodDto(ItemQuerySchema) {}

export const CreatePacketSectionSchema = z.object({
  name: z.string().min(1).max(100),
  maxQty: z.number().int().min(1).optional().default(1),
  sortOrder: z.number().int().optional(),
  productionStationId: z.number().int().optional(),
});

export const UpdatePacketSectionSchema = CreatePacketSectionSchema.partial();

export class CreatePacketSectionDto extends createZodDto(
  CreatePacketSectionSchema,
) {}
export class UpdatePacketSectionDto extends createZodDto(
  UpdatePacketSectionSchema,
) {}

export const CreatePacketSectionChoiceSchema = z.object({
  itemId: z.number().int().min(1),
  maxQty: z.number().int().min(1).optional().default(1),
  sortOrder: z.number().int().optional(),
});

export const UpdatePacketSectionChoiceSchema =
  CreatePacketSectionChoiceSchema.partial();

export class CreatePacketSectionChoiceDto extends createZodDto(
  CreatePacketSectionChoiceSchema,
) {}
export class UpdatePacketSectionChoiceDto extends createZodDto(
  UpdatePacketSectionChoiceSchema,
) {}
