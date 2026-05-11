import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateTableSchema = z.object({
  tableNumber: z.coerce.string().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateTableSchema = CreateTableSchema.partial();

export class CreateTableDto extends createZodDto(CreateTableSchema) {}
export class UpdateTableDto extends createZodDto(UpdateTableSchema) {}

export const TableQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export class TableQueryDto extends createZodDto(TableQuerySchema) {}
