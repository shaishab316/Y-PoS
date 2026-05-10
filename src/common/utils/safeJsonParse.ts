import { BadRequestException } from '@nestjs/common';

export const safeJsonParse = <T>(data: string): T => {
  try {
    return JSON.parse(data) as T;
  } catch (error: any) {
    throw new BadRequestException(`Invalid JSON: ${error.message}`);
  }
};
