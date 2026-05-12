import { OrderSource, OrderStatus, OrderType } from '@prisma/client';
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
  date: z.iso.date().optional(),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}
export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}
