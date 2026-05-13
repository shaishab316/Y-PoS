import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const DateRangeQuerySchema = z.object({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

export class DateRangeQueryDto extends createZodDto(DateRangeQuerySchema) {}
