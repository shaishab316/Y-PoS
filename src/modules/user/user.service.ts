import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserQueryDto,
  UserForShiftQueryDto,
  UpdateBusinessDto,
} from './user.dto';
import { hashPassword } from '@/common/helpers/hash.helper';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    // Check if email already exists
    if (data.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        photoUrl: data.photoUrl,
        address: data.address,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        productionStationId: data.productionStationId,
        isActive: true,
      },
    });

    // Generate slug
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        slug: `u-${user.id.toString().padStart(5, '0')}`,
      },

      omit: {
        passwordHash: true,
      },

      include: {
        productionStation: true,
      },
    });
  }

  async getAllUsers({ page, limit, search, role }: UserQueryDto) {
    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (role) {
      where.role = role;
    } else {
      where.role = {
        not: UserRole.USER,
      };
    }

    return Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionStation: true,
        },
        omit: {
          passwordHash: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  async getAllUsersForShift({ page, limit, search }: UserForShiftQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: {
        in: [UserRole.SERVICE, UserRole.ADMIN],
      },
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionStation: true,
        },
        omit: {
          passwordHash: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        productionStation: true,
      },
      omit: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateUser(id: number, data: UpdateUserDto) {
    // Verify user exists
    await this.getUserById(id);

    // Check if email already exists (if being updated)
    if (data.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        productionStation: true,
      },
      omit: {
        passwordHash: true,
      },
    });
  }

  async changePassword(id: number, data: ChangePasswordDto) {
    // Verify user exists
    await this.getUserById(id);

    // Hash new password
    const passwordHash = await hashPassword(data.password);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: number) {
    // Verify user exists
    await this.getUserById(id);

    return this.prisma.user.delete({
      where: { id },
      omit: {
        passwordHash: true,
      },
    });
  }

  async getOwner() {
    return await this.prisma.user.findFirst({
      where: {
        role: UserRole.OWNER,
      },
      omit: {
        passwordHash: true,
        otp: true,
        otpExpiry: true,
        role: true,
        id: true,
        slug: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });
  }

  async updateBusiness(data: UpdateBusinessDto & { logoUrl: string }) {
    let profile = await this.prisma.businessProfile.findFirst();

    if (!profile) {
      profile = await this.prisma.businessProfile.create({
        data: {
          address: data.businessAddress,
          contact: data.businessPhone,
          email: data.businessEmail,
          name: data.businessName,
          logoUrl: data.logoUrl,
          customNote: data.feedbackMsg,
        },
      });
      return profile;
    }

    return await this.prisma.businessProfile.update({
      where: { id: profile.id },
      data: {
        address: data.businessAddress,
        contact: data.businessPhone,
        email: data.businessEmail,
        name: data.businessName,
        logoUrl: data.logoUrl,
        customNote: data.feedbackMsg,
      },
    });
  }

  async getBusinessProfile() {
    return await this.prisma.businessProfile.findFirst();
  }
}
