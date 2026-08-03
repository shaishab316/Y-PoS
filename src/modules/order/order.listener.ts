import { SocketGateway } from '@/infra/socket/socket.gateway';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReceiptService } from './services/receipt.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ItemType } from '@prisma/client';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  constructor(
    private readonly socketGateway: SocketGateway,
    private readonly receiptService: ReceiptService,
    private readonly prisma: PrismaService,
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
  createReceiptOnOrderCreated(payload: any) {
    this.socketGateway.emit('*', 'pendingPayment', payload);
  }

  @OnEvent('order.paid')
  async handleOrderPaid(orderId: number) {
    try {
      this.logger.log(
        `📦 Processing inventory updates for paid order ${orderId}...`,
      );
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              item: true,
              packetChoices: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.error(
          `❌ Order with id ${orderId} not found for inventory processing`,
        );
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const orderItem of order.orderItems) {
        if (!orderItem.item) continue;
        const qty = orderItem.quantity ?? 1;

        if (orderItem.item.itemType === ItemType.INDIVIDUAL) {
          // Find last inventory log for this item to determine opening stock
          const lastLog = await this.prisma.inventoryLog.findFirst({
            where: { itemId: orderItem.itemId },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          });

          const openingStock =
            lastLog?.closingStock ?? orderItem.item.inventoryQty ?? 0;
          const closingStock = openingStock - qty;

          // Update item inventory
          await this.prisma.item.update({
            where: { id: orderItem.itemId! },
            data: { inventoryQty: closingStock },
          });

          // Create inventory log
          const log = await this.prisma.inventoryLog.create({
            data: {
              itemId: orderItem.itemId,
              itemName: orderItem.item.name,
              date: today,
              openingStock,
              stockSold: qty,
              closingStock,
              remarks: `Sold via order ${order.slug}`,
            },
          });

          // Set log slug
          await this.prisma.inventoryLog.update({
            where: { id: log.id },
            data: { slug: `il-${log.id.toString().padStart(5, '0')}` },
          });
        } else if (orderItem.item.itemType === ItemType.PACKET) {
          if (
            orderItem.packetChoices &&
            Array.isArray(orderItem.packetChoices)
          ) {
            const choices = orderItem.packetChoices as any[];
            const choiceItemIds = choices
              .map((c) => c.choiceItemId)
              .filter((id): id is number => typeof id === 'number');

            if (choiceItemIds.length > 0) {
              const choiceItems = await this.prisma.item.findMany({
                where: { id: { in: choiceItemIds } },
              });
              const choiceItemMap = new Map(choiceItems.map((i) => [i.id, i]));

              for (const choice of choices) {
                const choiceItemId = choice.choiceItemId;
                const choiceItem = choiceItemMap.get(choiceItemId);
                if (!choiceItem) continue;

                const choiceQty = (choice.quantity ?? 1) * qty;

                const lastLog = await this.prisma.inventoryLog.findFirst({
                  where: { itemId: choiceItemId },
                  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                });

                const openingStock =
                  lastLog?.closingStock ?? choiceItem.inventoryQty ?? 0;
                const closingStock = openingStock - choiceQty;

                // Update choice item inventory
                await this.prisma.item.update({
                  where: { id: choiceItemId },
                  data: { inventoryQty: closingStock },
                });

                // Create inventory log
                const log = await this.prisma.inventoryLog.create({
                  data: {
                    itemId: choiceItemId,
                    itemName: choiceItem.name,
                    date: today,
                    openingStock,
                    stockSold: choiceQty,
                    closingStock,
                    remarks: `Sold via packet item choice in order ${order.slug}`,
                  },
                });

                // Set log slug
                await this.prisma.inventoryLog.update({
                  where: { id: log.id },
                  data: { slug: `il-${log.id.toString().padStart(5, '0')}` },
                });
              }
            }
          }
        }
      }
      this.logger.log(
        `✅ Inventory updates completed for paid order ${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update inventory for order ${orderId}:`,
        error,
      );
    }
  }
}
