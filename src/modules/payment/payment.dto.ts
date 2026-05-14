import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const PaymentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(PaymentStatus).optional(),
  method: z.enum(PaymentMethod).optional(),
  search: z.string().optional(),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}
export class PaymentQueryDto extends createZodDto(PaymentQuerySchema) {}
