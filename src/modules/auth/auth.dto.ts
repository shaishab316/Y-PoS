import { sharedDtoSchema as _ } from '@/common/dto/sharedDtoSchema';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: _.password({ level: 'weak' }),
});

export class LoginDto extends createZodDto(LoginSchema) {}

// Forgot Password DTO
export const ForgotPasswordSchema = z.object({
  email: _.email({ trustCheck: false }),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

// Verify OTP DTO
export const VerifyOtpSchema = z.object({
  email: _.email({ trustCheck: false }),
  otp: _.otp(6),
});

export class VerifyOtpDto extends createZodDto(VerifyOtpSchema) {}

// Reset Password DTO
export const ResetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: _.password({ level: 'weak' }),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
