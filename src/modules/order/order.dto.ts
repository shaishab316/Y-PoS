import {
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const OrderItemSchema = z.object({
  itemId: z.number().int(),
  quantity: z.number().int().min(1).default(1),
  packetChoices: z
    .array(
      z.object({
        section: z.string(),
        choice: z.string(),
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .optional(),
});

export const CreateOrderSchema = z.object({
  userId: z.number().int().optional(),
  source: z.enum(OrderSource),
  type: z.enum(OrderType).optional().default(OrderType.DINE_IN),
  tableId: z.number().int().optional(),
  customerName: z.string().max(100).optional(),
  items: z.array(OrderItemSchema).min(1),
});

export const UpdateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
});

export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(1),
  limit: z.coerce.number().int().min(0).max(100).default(10),
  status: z.enum(OrderStatus).optional(),
  source: z.enum(OrderSource).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
  date: z.iso.date().optional(),
  search: z.string().optional(),
});

export const SubmitPaymentSchema = z.object({
  method: z.enum(PaymentMethod),
  assignedToId: z.number().int().optional(),
  cashReceived: z.number().optional(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}
export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}

const OrderProductionQuerySchema = OrderQuerySchema.omit({
  status: true,
});

export class OrderProductionQueryDto extends createZodDto(
  OrderProductionQuerySchema,
) {}
export class SubmitPaymentDto extends createZodDto(SubmitPaymentSchema) {}
export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

export const GetUserActiveOrdersSchema = z.object({
  userId: z.coerce.number().int(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export class GetUserActiveOrdersDto extends createZodDto(
  GetUserActiveOrdersSchema,
) {}
