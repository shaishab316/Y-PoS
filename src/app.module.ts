import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
    PrismaModule,
    UploadModule,
    MenuModule,
    RedisModule,
    HealthModule,
    SectionModule,
    ItemModule,
    ProductionStationModule,
    TableModule,
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
