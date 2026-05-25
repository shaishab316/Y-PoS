import { SocketGateway } from '@/infra/socket/socket.gateway';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReceiptService } from './services/receipt.service';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  constructor(
    private readonly socketGateway: SocketGateway,
    private readonly receiptService: ReceiptService,
  ) {}

  @OnEvent('order.sentToProduction')
  handleSentToProduction(payload: any) {
    this.socketGateway.emit('*', 'newOrder', payload);
  }

  @OnEvent('order.ready')
  handleOrderReady(payload: any) {
    this.socketGateway.emit('*', 'orderReady', payload);
  }

  @OnEvent('order.pickedUp')
  handleOrderPickedUp(payload: any) {
    this.socketGateway.emit('*', 'orderPickedUp', payload);
  }

  @OnEvent('order.created')
  async createReceiptOnOrderCreated(orderId: number) {
    try {
      this.logger.log(`🧾 Generating receipt for order ${orderId}...`);
      const receiptUrl =
        await this.receiptService.generateAndUploadReceipt(orderId);
      this.logger.log(`✅ Receipt generated and uploaded: ${receiptUrl}`);

      // Emit receipt event to frontend via socket
      this.socketGateway.emit('*', 'receiptGenerated', {
        orderId,
        receiptUrl,
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate receipt for order ${orderId}:`,
        error,
      );
      // Don't throw, just log - don't break order creation
    }
  }
}
