import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const DateRangeQuerySchema = z.object({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

export class DateRangeQueryDto extends createZodDto(DateRangeQuerySchema) {}

// Sales Report DTO
export const SalesReportSchema = z.object({
  period: z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  }),
  totalRevenue: z.number(),
  totalOrders: z.number(),
  averageOrderValue: z.number(),
  ordersByStatus: z.record(z.string(), z.number()),
});

export class SalesReportDto extends createZodDto(SalesReportSchema) {}

// Top Sellers DTO
export const TopSellerSchema = z.object({
  id: z.number(),
  name: z.string(),
  totalSold: z.number(),
  totalRevenue: z.number(),
  averagePrice: z.number(),
});

export const TopSellersReportSchema = z.object({
  period: z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  }),
  topSellers: z.array(TopSellerSchema),
  totalItemsSold: z.number(),
});

export class TopSellersReportDto extends createZodDto(TopSellersReportSchema) {}

// Order Types Report DTO
export const OrderTypeAnalysisSchema = z.object({
  type: z.string(),
  count: z.number(),
  percentage: z.number(),
  totalRevenue: z.number(),
  averageOrderValue: z.number(),
});

export const OrderTypesReportSchema = z.object({
  period: z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  }),
  orderTypes: z.array(OrderTypeAnalysisSchema),
  totalOrders: z.number(),
});

export class OrderTypesReportDto extends createZodDto(OrderTypesReportSchema) {}

// Production Performance DTO
export const ProductionMetricSchema = z.object({
  stationId: z.number(),
  stationName: z.string(),
  totalItemsProduced: z.number(),
  averageProductionTime: z.number(),
  efficiency: z.number(),
  itemsBreakdown: z.array(
    z.object({
      itemName: z.string(),
      count: z.number(),
      avgTime: z.number(),
    }),
  ),
});

export const ProductionPerformanceSchema = z.object({
  period: z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  }),
  stations: z.array(ProductionMetricSchema),
  overallEfficiency: z.number(),
});

export class ProductionPerformanceDto extends createZodDto(
  ProductionPerformanceSchema,
) {}

// Proof Images Report DTO
export const ProofImageSchema = z.object({
  id: z.number(),
  orderId: z.number(),
  imageUrl: z.string(),
  uploadedAt: z.iso.date(),
  status: z.string(),
});

export const ProofImagesReportSchema = z.object({
  period: z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  }),
  images: z.array(ProofImageSchema),
  totalImages: z.number(),
  byStatus: z.record(z.string(), z.number()),
});

export class ProofImagesReportDto extends createZodDto(
  ProofImagesReportSchema,
) {}
