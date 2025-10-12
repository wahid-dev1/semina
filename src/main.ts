import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Normalize comma-separated origins and ensure they include an HTTP(S) scheme.
function resolveCorsOrigins(): string | string[] {
  const rawOrigins =
    process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';

  const normalized = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      if (origin === '*' || /^https?:\/\//i.test(origin)) {
        return origin;
      }

      return `http://${origin}`;
    });

  if (normalized.includes('*')) {
    return '*';
  }

  if (normalized.length === 0) {
    return 'http://localhost:3000';
  }

  if (normalized.length === 1) {
    return normalized[0];
  }

  return normalized;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS configuration
  const corsOrigin = resolveCorsOrigins();
  app.enableCors({
    origin: corsOrigin,
    credentials: corsOrigin === '*' ? false : true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Medical POS System API')
    .setDescription('Backend API for Medical POS System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
