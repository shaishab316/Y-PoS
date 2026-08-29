import {
  PaymentMethod,
  PaymentStatus,
  PaymentVerificationStatus,
} from '@prisma/client';
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

export const VerifyPaymentSchema = z.object({
  verifiedById: z.coerce.number().int().min(1),
  cashReceived: z.coerce.number().min(0),
});

export const TodayPaymentVerifySchema = z.object({
  // Opening
  openingCash: z.coerce.number().min(0).nullable().optional(),
  cashIn: z.coerce.number().min(0).nullable().optional(),
  totalOpeningCash: z.coerce.number().min(0).nullable().optional(),

  // Sales
  incomeCash: z.coerce.number().min(0).nullable().optional(),
  actualIncomeCash: z.coerce.number().min(0).nullable().optional(),
  incomeTransfer: z.coerce.number().min(0).nullable().optional(),
  actualTransfer: z.coerce.number().min(0).nullable().optional(),
  totalSales: z.coerce.number().min(0).nullable().optional(),
  actualSales: z.coerce.number().min(0).nullable().optional(),

  // CashOut
  expensesCash: z.coerce.number().min(0).nullable().optional(),
  expenseRemark: z.string().nullable().optional(),
  cashDeposit: z.array(z.string()).default([]),

  // Closing
  closingCash: z.coerce.number().min(0).nullable().optional(),
  proofImages: z.array(z.string()).default([]),

  // Verification
  remark: z.string().nullable().optional(),
  verifiedById: z.coerce.number().int().min(1),
});

export const UpdatePaymentVerificationStatusSchema = z.object({
  status: z.enum(PaymentVerificationStatus),
  verifiedById: z.coerce.number().int().min(1),
  correctAmount: z.coerce.number().optional(),
  mismatchReason: z.string().max(5000).optional(),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}
export class PaymentQueryDto extends createZodDto(PaymentQuerySchema) {}
export class VerifyPaymentDto extends createZodDto(VerifyPaymentSchema) {}
export class TodayPaymentVerifyDto extends createZodDto(
  TodayPaymentVerifySchema,
) {}
export class UpdatePaymentVerificationStatusDto extends createZodDto(
  UpdatePaymentVerificationStatusSchema,
) {}
