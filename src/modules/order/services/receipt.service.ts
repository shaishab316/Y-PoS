/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '@/infra/upload/cloudinary.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { UserService } from '@/modules/user/user.service';
import {
  ReceiptGeneratorService,
  ReceiptData,
} from './receipt-generator.service';
import { RedisService } from '@/infra/redis/redis.service';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private readonly receiptGenerator: ReceiptGeneratorService,
    private readonly cloudinary: CloudinaryService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly redis: RedisService,
  ) {}

  async generateAndUploadReceipt(orderId: number): Promise<string> {
    try {
      this.logger.log(`📄 Generating receipt for order ${orderId}...`);

      // Fetch order details
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          orderItems: {
            include: {
              item: true,
            },
          },
          payment: true,
        },
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Get restaurant info (owner)
      const owner = await this.userService.getBusinessProfile();
      if (!owner) {
        throw new Error('Restaurant owner information not found');
      }

      // Prepare pricing adjustments display
      const pricingAdjustments: Array<{ name: string; amount: number }> = [];
      if (
        order.pricingAdjustments &&
        typeof order.pricingAdjustments === 'object'
      ) {
        const adjustments = order.pricingAdjustments as Array<{
          id: number;
          level: string;
          type: string;
          percentage: number | null;
          fixedAmount: number | null;
        }>;

        adjustments.forEach((adj) => {
          if (adj.type === 'PERCENTAGE' && adj.percentage) {
            const amount = (Number(order.subtotal || 0) * adj.percentage) / 100;
            pricingAdjustments.push({
              name: `${adj.level} (${adj.percentage}%)`,
              amount,
            });
          } else if (adj.type === 'FIXED_AMOUNT' && adj.fixedAmount) {
            pricingAdjustments.push({
              name: adj.level,
              amount: Number(adj.fixedAmount),
            });
          }
        });
      }

      // Prepare receipt data
      const receiptData: ReceiptData = {
        orderNumber: order.slug || `O-${order.id}`,
        orderDate: order.createdAt || new Date(),
        orderType: order.type || 'DINE_IN',
        tableNumber: order.table?.tableNumber ?? undefined,
        customerName: order.customerName ?? undefined,
        items: order.orderItems.map((oi) => ({
          name: oi.itemName || oi.item?.name || 'Unknown Item',
          quantity: oi.quantity || 1,
          unitPrice: Number(oi.unitPrice || 0),
          total: Number(oi.unitPrice || 0) * (oi.quantity || 1),
        })),
        subtotal: Number(order.subtotal || 0),
        pricingAdjustments:
          pricingAdjustments.length > 0 ? pricingAdjustments : undefined,
        totalAmount: Number(order.totalAmount || 0),
        paymentMethod: order.payment?.[0]?.method || 'Not specified',
        restaurantName: owner.name || '',
        restaurantPhone: owner.contact || '',
        restaurantEmail: owner.email || '',
        restaurantAddress: owner.address || '',
        restaurantLogoUrl: owner.logoUrl || '',
      };

      // Generate PDF
      const pdfStream =
        await this.receiptGenerator.generateReceiptPdf(receiptData);

      // Upload to Cloudinary
      const result = await new Promise<{ url: string }>((resolve, reject) => {
        const chunks: Buffer[] = [];

        pdfStream
          .on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          })
          .on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);

              const mockFile: Express.Multer.File = {
                fieldname: 'receipt',
                originalname: `receipt-${order.slug || orderId}.pdf`,
                encoding: '7bit',
                mimetype: 'application/pdf',
                size: buffer.length,
                destination: '',
                filename: `receipt-${order.slug || orderId}.pdf`,
                path: '',
                buffer,
                stream: null as any,
              };

              const uploadResult = await this.cloudinary.uploadFile({
                file: mockFile,
                folder: 'receipts',
                resourceType: 'raw',
              });

              resolve({ url: uploadResult.url });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          receiptUrl: result.url,
        },
      });

      await this.redis.deleteByPattern(({ RESPONSE }) => RESPONSE('order:*'));

      this.logger.log(
        `✅ Receipt generated and uploaded for order ${orderId}: ${result.url}`,
      );

      return result.url;
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate receipt for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }
}
