import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderDto,
  SubmitPaymentDto,
  PaginationQueryDto,
} from './order.dto';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    const itemIds = dto.items.map((i) => i.itemId);

    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: { packetSections: { include: { choices: true } } },
    });

    if (items.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found');
    }

    for (const item of items) {
      if (item.isOutOfStock) {
        throw new BadRequestException(`Item "${item.name}" is out of stock`);
      }
    }

    const itemMap = new Map(items.map((i) => [i.id, i]));

    let subtotal = 0;

    const orderItems = dto.items.map((orderItem) => {
      const item = itemMap.get(orderItem.itemId)!;
      const unitPrice = Number(
        item.hasPromo && item.promoPrice ? item.promoPrice : item.price,
      );
      subtotal += unitPrice * orderItem.quantity;

      return {
        itemId: item.id,
        productionStationId: item.productionStationId,
        itemName: item.name,
        unitPrice,
        promoPrice: item.promoPrice ? Number(item.promoPrice) : null,
        quantity: orderItem.quantity,
        packetChoices: orderItem.packetChoices ?? Prisma.JsonNull,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        source: dto.source,
        type: dto.type,
        tableId: dto.tableId,
        customerName: dto.customerName,
        subtotal,
        totalAmount: subtotal,
        orderItems: { create: orderItems },
      },
      include: { orderItems: true },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { slug: `o-${order.id.toString().padStart(5, '0')}` },
    });

    return order;
  }

  async getAllOrders({ page, limit, status, source, date }: OrderQueryDto) {
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    return Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          table: true,
          assignedTo: true,
          orderItems: { include: { item: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  async getOrderById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        assignedTo: true,
        orderItems: {
          include: {
            item: true,
            productionStation: true,
          },
        },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    return order;
  }

  async updateOrder(id: number, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    if (order.payment.length > 0) {
      throw new BadRequestException('Cannot edit order after payment');
    }

    const itemIds = dto.items.map((i) => i.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });

    if (items.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found');
    }

    const itemMap = new Map(items.map((i) => [i.id, i]));
    let subtotal = 0;

    const orderItems = dto.items.map((orderItem) => {
      const item = itemMap.get(orderItem.itemId)!;
      const unitPrice = Number(
        item.hasPromo && item.promoPrice ? item.promoPrice : item.price,
      );
      subtotal += unitPrice * orderItem.quantity;

      return {
        itemId: item.id,
        productionStationId: item.productionStationId,
        itemName: item.name,
        unitPrice,
        promoPrice: item.promoPrice ? Number(item.promoPrice) : null,
        quantity: orderItem.quantity,
        packetChoices: orderItem.packetChoices ?? Prisma.JsonNull,
      };
    });

    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });

    return this.prisma.order.update({
      where: { id },
      data: {
        subtotal,
        totalAmount: subtotal,
        orderItems: { create: orderItems },
      },
      include: { orderItems: true },
    });
  }

  async cancelOrderItem(orderId: number, orderItemId: string) {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { id: orderItemId, orderId },
    });

    if (!orderItem) throw new NotFoundException('Order item not found');
    if (orderItem.isCancelled)
      throw new BadRequestException('Item already cancelled');

    return this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        status: 'CANCELLED',
      },
    });
  }

  async getPendingPaymentOrders(pagination: PaginationQueryDto) {
    const where = {
      payment: {
        none: {
          status: PaymentStatus.PAID,
        },
      },
    };

    return Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          table: true,
          assignedTo: true,
          orderItems: { include: { item: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  async submitOrderPayment(
    orderId: number,
    dto: SubmitPaymentDto & { proofImages: string[] },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);

    // Check if payment already exists
    if (order.payment.length > 0) {
      throw new BadRequestException('Payment already submitted for this order');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: dto.method,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        proofImages: dto.proofImages,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Update order with assigned staff and generate payment slug
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        slug: `pay-${payment.id.toString().padStart(5, '0')}`,
      },
    });

    // Update order to assign staff if provided
    if (dto.assignedToId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { assignedToId: dto.assignedToId },
      });
    }

    return this.prisma.payment.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });
  }
}
