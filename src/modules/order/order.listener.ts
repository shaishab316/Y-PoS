import { SocketGateway } from '@/infra/socket/socket.gateway';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class OrderListener {
  constructor(private readonly socketGateway: SocketGateway) {}

  @OnEvent('order.sentToProduction')
  handleSentToProduction(payload: any) {
    this.socketGateway.emit('*', 'newOrder', payload);
  }

  @OnEvent('order.ready')
  handleOrderReady(payload: any) {
    // Emit collection alert to all clients
    this.socketGateway.emit('*', 'orderReady', {
      orderId: payload.orderId,
      tableId: payload.tableId,
      message: 'Order is ready for pickup',
    });
  }
}
