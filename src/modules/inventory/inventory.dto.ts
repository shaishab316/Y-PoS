import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const InventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

export class InventoryQueryDto extends createZodDto(InventoryQuerySchema) {}

export const StockInSchema = z.object({
  itemId: z.number().int().positive('Item ID must be a positive number'),
  qty: z.number().int().positive('Quantity must be a positive number'),
  remarks: z.string().max(500).optional(),
});

export class StockInDto extends createZodDto(StockInSchema) {}

export const StockOutSchema = z.object({
  itemId: z.number().int().positive('Item ID must be a positive number'),
  qty: z.number().int().positive('Quantity must be a positive number'),
  remarks: z
    .string()
    .max(500)
    .optional()
    .describe('Reason for stock out (e.g., spoilage, damage, etc.)'),
});

export class StockOutDto extends createZodDto(StockOutSchema) {}

export const ReportQuerySchema = z.object({
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid date format'),
  export: z.enum(['PDF', 'EXCEL']).optional(),
});

export class ReportQueryDto extends createZodDto(ReportQuerySchema) {}
