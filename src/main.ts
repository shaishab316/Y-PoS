import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import chalk from 'chalk';
import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { setupApiDocs } from './common/config/api-docs.config';
import type { Env } from './common/config/app.config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BasicAuthMiddleware } from './common/middlewares/basic-auth.middleware';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Starting application bootstrap...');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  //? trust proxy for correct client IP detection behind proxies (e.g., in production)
  app.set('trust proxy', 1);

  //? use Winston for logging
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService<Env, true>);
  logger.log('✅ Configuration loaded successfully');

  //? security headers
  logger.log('⚔️  Configuring security headers...');
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/docs')) {
      helmet({ contentSecurityPolicy: false })(req, res, next);
    } else {
      helmet()(req, res, next);
    }
  });

  //? cors
  const corsOrigin = config.get('CORS_ORIGIN', { infer: true });
  const allowedOrigins = new Set(corsOrigin === '*' ? [] : corsOrigin);

  logger.log(`📡 CORS enabled for origin: ${corsOrigin.toString()}`);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigin === '*' || allowedOrigins.has(origin))
        return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  //? parse json body
  app.use(
    express.json({
      limit: '1mb',
    }),
  );

  //? gzip compression
  logger.log('🗜️  Gzip compression enabled');
  app.use(
    compression({
      threshold: 1024,
      filter: (req: Request, res: Response) =>
        req.headers['x-no-compression'] ? false : compression.filter(req, res),
    }),
  );

  //? global prefix
  logger.log('🔧 Setting global prefix to /api/v1');
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'queues', 'docs', 'docs-json', 'docs-yaml'],
  });

  //? protect /docs and /queues with basic auth
  logger.log('🔐 Protecting /docs and /queues endpoints with basic auth');
  const docsUsername = config.get('DOCS_USERNAME', { infer: true });
  const docsPassword = config.get('DOCS_PASSWORD', { infer: true });
  const queuesUsername = config.get('QUEUES_USERNAME', { infer: true });
  const queuesPassword = config.get('QUEUES_PASSWORD', { infer: true });

  const docsAuth = new BasicAuthMiddleware(docsUsername, docsPassword);
  const queuesAuth = new BasicAuthMiddleware(queuesUsername, queuesPassword);

  app.use('/docs', (req: Request, res: Response, next: NextFunction) =>
    docsAuth.use(req, res, next),
  );
  app.use('/docs-json', (req: Request, res: Response, next: NextFunction) =>
    docsAuth.use(req, res, next),
  );
  app.use('/docs-yaml', (req: Request, res: Response, next: NextFunction) =>
    docsAuth.use(req, res, next),
  );
  app.use('/queues', (req: Request, res: Response, next: NextFunction) =>
    queuesAuth.use(req, res, next),
  );

  //? global pipes — zod validation
  logger.log('✔️  Zod validation pipe configured');
  app.useGlobalPipes(new ZodValidationPipe());

  //? global interceptors
  logger.log('🎯 Global interceptors registered (Response, Cache)');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(app.get(CacheInterceptor));

  //? global exception filter
  logger.log('🛡️  Global exception filter configured');
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalExceptionFilter({ httpAdapter } as HttpAdapterHost),
  );

  logger.log('📖 Setting up API documentation...');
  setupApiDocs(app);

  //? Enable shutdown hooks to allow graceful shutdown of the application
  logger.log('🔄 Graceful shutdown hooks enabled');
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  const appUrl = await app.getUrl();
  logger.log(`✨ Application is running on: ${chalk.blue(appUrl)}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application', err);
  process.exit(1);
});
