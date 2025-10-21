/* eslint-disable import/no-unresolved */
import 'reflect-metadata';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { join, resolve } from 'path';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config as configDotenv } from 'dotenv';
import * as express from 'express';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';


async function bootstrap() {
  configDotenv({ debug: false, override: true, quiet: true });

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.enableCors();

  const rootDir = path.resolve(__dirname, '..', '..');
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use(express.static(path.join(rootDir, 'frontend')));

  // Swagger/OpenAPI setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trade API')
    .setDescription('Auto-generated OpenAPI documentation for Trade backend')
    .setVersion('1.0.0')
    .addServer('http://localhost:3000')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {ignoreGlobalPrefix: true});
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
  const outPath = join(resolve(__dirname, '..'), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  await app.listen(PORT);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during Nest bootstrap:', err);
  process.exit(1);
});
