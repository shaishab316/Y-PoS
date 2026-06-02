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
  OrderProductionQueryDto,
  GetUserActiveOrdersDto,
} from './order.dto';
import { Prisma, PaymentStatus, OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    // Fetch all pricing adjustments from database
    const pricingAdjustmentsFromDb =
      await this.prisma.pricingAdjustment.findMany();

    let totalAmount = subtotal;
    const pricingAdjustmentsSnapshots = pricingAdjustmentsFromDb.map((adj) => ({
      id: adj.id,
      level: adj.level,
      type: adj.type,
      percentage: adj.percentage ? Number(adj.percentage) : null,
      fixedAmount: adj.fixedAmount ? Number(adj.fixedAmount) : null,
    }));

    // Apply adjustments to calculate total amount
    for (const adjustment of pricingAdjustmentsFromDb) {
      if (adjustment.type === 'PERCENTAGE' && adjustment.percentage) {
        const adjustmentAmount =
          (subtotal * Number(adjustment.percentage)) / 100;
        totalAmount += adjustmentAmount;
      } else if (adjustment.type === 'FIXED_AMOUNT' && adjustment.fixedAmount) {
        totalAmount += Number(adjustment.fixedAmount);
      }
    }

    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        source: dto.source,
        type: dto.type,
        tableId: dto.tableId,
        customerName: dto.customerName,
        subtotal,
        totalAmount,
        pricingAdjustments:
          pricingAdjustmentsSnapshots.length > 0
            ? pricingAdjustmentsSnapshots
            : Prisma.JsonNull,
        orderItems: { create: orderItems },
      },
      include: { orderItems: true },
    });

    this.eventEmitter.emit('order.created', order.id);

    await this.prisma.order.update({
      where: { id: order.id },
      data: { slug: `o-${order.id.toString().padStart(5, '0')}` },
    });

    return order;
  }

  async getAllOrders({
    page,
    limit,
    status,
    source,
    paymentStatus,
    date,
    search,
  }: OrderQueryDto) {
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (paymentStatus) {
      if (paymentStatus === PaymentStatus.PENDING) {
        // For PENDING: include orders with no payment OR with payment status PENDING
        where.OR = [
          { payment: { none: {} } },
          { payment: { some: { status: PaymentStatus.PENDING } } },
        ];
      } else {
        where.payment = {
          some: { status: paymentStatus },
        };
      }
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    if (search) {
      if (!where.OR) {
        where.OR = [];
      }

      where.OR.push(
        { customerName: { contains: search, mode: 'insensitive' } },
        {
          orderItems: {
            some: { itemName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          slug: { contains: search, mode: 'insensitive' },
        },
      );
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
          payment: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  async getAllProductionOrders({
    page,
    limit,
    source,
    paymentStatus,
    date,
    search,
  }: OrderProductionQueryDto) {
    const where: Prisma.OrderWhereInput = {
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.PENDING] },
    };

    if (source) where.source = source;
    if (paymentStatus) {
      if (paymentStatus === PaymentStatus.PENDING) {
        // For PENDING: include orders with no payment OR with payment status PENDING
        where.OR = [
          { payment: { none: {} } },
          { payment: { some: { status: PaymentStatus.PENDING } } },
        ];
      } else {
        where.payment = {
          some: { status: paymentStatus },
        };
      }
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    if (search) {
      if (!where.OR) {
        where.OR = [];
      }

      where.OR.push(
        { customerName: { contains: search, mode: 'insensitive' } },
        {
          orderItems: {
            some: { itemName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          slug: { contains: search, mode: 'insensitive' },
        },
      );
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
          payment: true,
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

  async editOrder(id: number, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot edit order in "${order.status}" status. Only PENDING orders can be edited.`,
      );
    }

    const itemIds = dto.items.map((i) => i.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
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

  async cancelOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel order in "${order.status}" status. Only PENDING orders can be cancelled.`,
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: { orderItems: true },
    });
  }

  async getPaymentOrders(
    pagination: PaginationQueryDto,
    isPaid: boolean | undefined = undefined,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today: 00:00:00.000

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow: 00:00:00.000

    const where: Prisma.OrderWhereInput = {
      createdAt: {
        gte: today, // >= start of today
        lt: tomorrow, // < start of tomorrow
      },
    };

    if (isPaid !== undefined) {
      if (isPaid) {
        where.payment = {
          some: {
            status: PaymentStatus.PAID,
          },
        };
      } else {
        where.payment = {
          none: {
            status: PaymentStatus.PAID,
          },
        };
      }
    }

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

  async sendOrderToProduction(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        payment: true,
        table: {
          select: {
            tableNumber: true,
            notes: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PENDING_PROCESSING
    ) {
      throw new BadRequestException(
        `Order is in "${order.status}" status and cannot be sent to production`,
      );
    }

    this.eventEmitter.emit('order.sentToProduction', order);

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.PENDING_PROCESSING },
      include: { orderItems: true },
    });
  }

  async acceptOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.PROCESSING,
        processedAt: new Date(),
      },
      include: { orderItems: true },
    });
  }

  async markOrderReady(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.READY,
        readyAt: new Date(),
      },
      include: {
        orderItems: true,
        table: {
          select: {
            tableNumber: true,
            notes: true,
          },
        },
      },
    });

    this.eventEmitter.emit('order.ready', updatedOrder);

    return updatedOrder;
  }

  async markOrderPickedUp(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.PICKED_UP,
        pickedUpAt: new Date(),
      },
      include: {
        orderItems: true,
        table: {
          select: {
            tableNumber: true,
            notes: true,
          },
        },
      },
    });

    this.eventEmitter.emit('order.pickedUp', updatedOrder);

    return updatedOrder;
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
        cashReceived: dto.cashReceived,
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

  async gerUserActiveOrders({ limit, page, userId }: GetUserActiveOrdersDto) {
    const where: Prisma.OrderWhereInput = {
      userId,
      status: {
        not: OrderStatus.CANCELLED,
      },
      createdAt: {
        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // last 24 hours
      },
    };

    return await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          table: true,
          assignedTo: true,
          orderItems: { include: { item: true } },
          payment: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
  }
}
