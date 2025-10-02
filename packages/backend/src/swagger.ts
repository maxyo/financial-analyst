import 'reflect-metadata';
import { writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Trade API')
    .setDescription('Auto-generated OpenAPI documentation for Trade backend')
    .setVersion('1.0.0')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  const outPath = join(resolve(__dirname, '..'), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf-8');
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec generated at: ${outPath}`);
}

generate().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI spec:', e);
  process.exit(1);
});
