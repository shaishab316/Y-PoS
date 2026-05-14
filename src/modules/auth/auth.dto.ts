import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: _.password({ level: 'weak' }),
});

export class LoginDto extends createZodDto(LoginSchema) {}
