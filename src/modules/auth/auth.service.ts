/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { LoginDto } from './auth.dto';
import { comparePassword } from '@/common/helpers/hash.helper';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
