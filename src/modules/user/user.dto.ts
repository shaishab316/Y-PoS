import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { UserRole } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateUserSchema = z.object({
  name: _.name({ field: 'User name' }),
  email: _.email().optional(),
  phone: _.phoneNumber().optional(),
  password: _.password({ level: 'weak' }),
  role: z.enum(UserRole).optional(),
  photoUrl: z.string().url().optional(),
  address: z.string().max(255).optional(),
  facebookUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  productionStationId: z.number().int().optional(),
  feedbackMsg: z.string().trim().max(500).optional(),
});

export const UpdateUserSchema = CreateUserSchema.omit({
  password: true,
}).partial();

export const ChangePasswordSchema = z.object({
  password: _.password({ level: 'weak' }),
});

export const UserQuerySchema = z.object({
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(10),
  search: z.string().optional(),
  role: z.enum(UserRole).optional(),
});

export const UserForShiftQuerySchema = UserQuerySchema.omit({ role: true });

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
export class UserQueryDto extends createZodDto(UserQuerySchema) {}
export class UserForShiftQueryDto extends createZodDto(
  UserForShiftQuerySchema,
) {}
