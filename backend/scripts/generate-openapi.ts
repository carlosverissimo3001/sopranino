/**
 * This script generates the OpenAPI specification for the backend API.
 * The resulting JSON file is placed at the root of the project, to be consumed by the frontend SDK generator.
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Sopranino API')
    .setVersion('1.0')
    .addCookieAuth('unpaused_session')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.resolve(__dirname, '../../swagger-spec.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ Swagger JSON generated at ${outputPath}`);
  await app.close();
  process.exit(0);
}

// Top-level await isn't available under this module target.
void generate();
