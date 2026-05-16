import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './auth.dto';
import type { ApiResponse } from '@/common/types/api-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<ApiResponse> {
    const data = await this.authService.login(body);

    return { message: 'Login successful', data };
  }

  @Post('user-login')
  @HttpCode(HttpStatus.OK)
  async userLogin(@Body('userId') userId?: string): Promise<ApiResponse> {
    const user = await this.authService.userLogin(
      userId ? parseInt(userId, 10) : undefined,
    );

    return {
      message: 'User login successful',
      data: user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<ApiResponse> {
    const result = await this.authService.forgotPassword(body);

    return { message: result.message };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<ApiResponse> {
    const data = await this.authService.verifyOtp(body);

    return { message: data.message, data: { resetToken: data.resetToken } };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<ApiResponse> {
    const result = await this.authService.resetPassword(body);

    return { message: result.message };
  }
}
