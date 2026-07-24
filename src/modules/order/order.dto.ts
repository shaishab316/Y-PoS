import {
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  PricingAdjustmentType,
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
        choiceItemId: z.number().int(),
        quantity: z.number().int().min(1).default(1),
        productionStationId: z.number().int().optional(),
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
  assignedToId: z.coerce.number().int().optional(),
  cashReceived: z.coerce.number().optional(),
  changeAmount: z.coerce.number().optional(),
  cashierId: z.coerce.number().int().optional(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

export const UpdateOrderPricingAdjustmentsSchema = z.object({
  pricingAdjustments: z.array(
    z
      .object({
        id: z.number().int().optional(),
        level: z.string().max(255),
        type: z.enum(PricingAdjustmentType),
        percentage: z.number().optional().nullable(),
        fixedAmount: z.number().optional().nullable(),
      })
      .refine(
        (data) => {
          if (data.type === PricingAdjustmentType.PERCENTAGE) {
            return data.percentage !== undefined && data.percentage !== null;
          }
          if (data.type === PricingAdjustmentType.FIXED_AMOUNT) {
            return data.fixedAmount !== undefined && data.fixedAmount !== null;
          }
          return false;
        },
        {
          message:
            'percentage is required for PERCENTAGE type, and fixedAmount is required for FIXED_AMOUNT type',
        },
      ),
  ),
});

export class UpdateOrderPricingAdjustmentsDto extends createZodDto(
  UpdateOrderPricingAdjustmentsSchema,
) {}
