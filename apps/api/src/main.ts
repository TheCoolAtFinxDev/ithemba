// Must be the very first import — Sentry's NestJS auto-instrumentation
// depends on initializing before anything else is required.
import './instrument';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { SentryExceptionFilter } from './common/sentry-exception.filter';

async function bootstrap() {
  // Body parsing is wired manually below so the Golink webhook route can read
  // the raw request bytes — needed for HMAC signature verification, which
  // breaks if the body has already been parsed/re-serialized by Express.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

  // CSP disabled — this is an API, not a page-serving app, except for the
  // Swagger UI at /api/docs, whose inline scripts a default CSP would block.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.setGlobalPrefix('api');
  app.use('/api/webhooks/golink', express.raw({ type: '*/*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:4200', 'https://myhealth.ithembahealth.com'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('IthembaHealth API')
    .setDescription('IthembaHealth platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}/api`);
  Logger.log(`Swagger at http://localhost:${port}/api/docs`);
}

bootstrap();