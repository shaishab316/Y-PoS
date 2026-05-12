import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class OrderListener {
  @OnEvent('order.sent-to-production')
  handleSentToProduction(payload: { orderId: number }) {
    console.log('Order sent to production from OrderListener:', payload);
  }
}
