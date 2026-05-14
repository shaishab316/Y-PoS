import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { UpdateOperatingHoursDto } from './operating-hours.dto';

@Injectable()
export class OperatingHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperatingHours() {
    let hours = await this.prisma.operatingHours.findFirst();

    // Create default record if it doesn't exist
    if (!hours) {
      hours = await this.prisma.operatingHours.create({
        data: {},
      });
    }

    return hours;
  }

  async updateOperatingHours(data: UpdateOperatingHoursDto) {
    const hours = await this.getOperatingHours();

    return this.prisma.operatingHours.update({
      where: { id: hours.id },
      data,
    });
  }
}
