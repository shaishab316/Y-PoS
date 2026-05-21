import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const timeSchema = z
  .string()
  // .regex(timeRegex, 'Invalid time format. Use HH:mm')
  .refine((val) => {
    if (val) {
      if (!timeRegex.test(val)) {
        throw new Error('Invalid time format. Use HH:mm');
      }
    }

    return true;
  })
  .optional()
  .nullable();

export const UpdateOperatingHoursSchema = z.object({
  sundayStart: timeSchema,
  sundayEnd: timeSchema,
  mondayStart: timeSchema,
  mondayEnd: timeSchema,
  tuesdayStart: timeSchema,
  tuesdayEnd: timeSchema,
  wednesdayStart: timeSchema,
  wednesdayEnd: timeSchema,
  thursdayStart: timeSchema,
  thursdayEnd: timeSchema,
  fridayStart: timeSchema,
  fridayEnd: timeSchema,
  saturdayStart: timeSchema,
  saturdayEnd: timeSchema,
});

export class UpdateOperatingHoursDto extends createZodDto(
  UpdateOperatingHoursSchema,
) {}
