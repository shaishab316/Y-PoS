/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './auth.dto';
import { comparePassword, hashPassword } from '@/common/helpers/hash.helper';
import { User, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { MailService } from '@/infra/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('User does not have a password set');
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash, ...userResponse } = user;

    return userResponse;
  }

  async userLogin(userId?: number) {
    let user: Omit<User, 'passwordHash'> | null = null;

    if (!userId) {
      const newUser = await this.prisma.user.create({
        data: {
          role: UserRole.USER,
        },
      });

      user = await this.prisma.user.update({
        where: { id: newUser.id },
        data: {
          slug: `u-${newUser.id.toString().padStart(5, '0')}`,
        },
        omit: {
          passwordHash: true,
        },
      });
    } else {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        omit: { passwordHash: true },
      });
    }

    if (user!.role !== UserRole.USER) {
      throw new UnauthorizedException(
        'User login only allowed for users with USER role',
      );
    }

    return user;
  }

  /**
   * Generate and send OTP for password recovery
   */
  async forgotPassword(data: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (!user) {
      // Don't reveal if email exists for security reasons
      return { message: 'If email exists, OTP has been sent' };
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiry,
      },
    });

    // TODO: Send OTP via email (integrate with email service)
    console.log(`OTP for ${data.email}: ${otp}`);

    await this.mailService.sendMail({
      email: user.email!,
      subject: 'Smart pos Password Reset Request',
      body: `Hi ${user.name},\n\nWe received a request to reset your password for your Smart pos account. Your password reset code is: ${otp}\n\nPlease enter this code in the app to reset your password.\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nThe Smart pos Team`,
    });

    return { message: 'If email exists, OTP has been sent' };
  }

  /**
   * Verify OTP provided by user
   */
  async verifyOtp(data: VerifyOtpDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (!user.otp || user.otp !== data.otp) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Generate reset token for password reset
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        otp: null,
        otpExpiry: null,
      },
    });

    return {
      message: 'OTP verified successfully',
      resetToken,
    };
  }

  /**
   * Reset password using reset token and new password
   */
  async resetPassword(data: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: data.resetToken },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    // Hash the new password
    const passwordHash = await hashPassword(data.newPassword);

    // Clear OTP and reset token after successful password reset
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
