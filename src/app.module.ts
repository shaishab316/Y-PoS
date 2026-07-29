import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  validate as configValidate,
  type Env,
} from './common/config/app.config';
import { getThrottlerConfig } from './common/config/throttler.config';
import { PrismaModule } from './infra/prisma/prisma.module';
import { LoggerMiddleware } from './common/middlewares';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { APP_GUARD } from '@nestjs/core';
import { UploadModule } from './infra/upload/upload.module';
import { MenuModule } from './modules/menu/menu.module';
import { RedisModule } from './infra/redis/redis.module';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { SectionModule } from './modules/section/section.module';
import { ItemModule } from './modules/item/item.module';
import { ProductionStationModule } from './modules/production-station/production-station.module';
import { HealthModule } from './modules/health/health.module';
import { TableModule } from './modules/table/table.module';
import { OrderModule } from './modules/order/order.module';
import { SocketModule } from './infra/socket/socket.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PaymentModule } from './modules/payment/payment.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { UserModule } from './modules/user/user.module';
import { OperatingHoursModule } from './modules/operating-hours/operating-hours.module';
import { ShiftModule } from './modules/shift/shift.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './infra/mail/mail.module';
import { PricingAdjustmentModule } from './modules/pricing-adjustment/pricing-adjustment.module';
import { AdditionalPricingAdjustmentModule } from './modules/pricing-adjustment/additional-pricing-adjustment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidate,
    }),
    ThrottlerModule.forRoot(getThrottlerConfig()),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
          new LokiTransport({
            host: config.get('LOKI_URL', { infer: true }),
            labels: { job: 'nestjs', app: 'graceperman' },
          }),
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    UploadModule,
    RedisModule,
    SocketModule,
    MailModule,
    AnalyticsModule,
    PaymentModule,
    HealthModule,
    MenuModule,
    SectionModule,
    ItemModule,
    ProductionStationModule,
    TableModule,
    OrderModule,
    InventoryModule,
    ReportingModule,
    UserModule,
    OperatingHoursModule,
    ShiftModule,
    AuthModule,
    PricingAdjustmentModule,
    AdditionalPricingAdjustmentModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    CacheInterceptor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
