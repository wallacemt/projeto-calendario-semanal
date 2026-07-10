import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpExceptionFilter());
  // Security headers (LSF-2026-004/007): CSP, X-Content-Type-Options,
  // X-Frame-Options, HSTS etc. — a API não serve HTML, mas ainda serve o
  // Swagger em /docs e responde a chamadas de um front que roda em outra
  // origem, então esses headers continuam valendo (ex.: cliques em /docs,
  // MIME sniffing em respostas de erro).
  app.use(helmet());
  app.use(cookieParser());
  // credentials:true é obrigatório para o cookie httpOnly de refresh
  // (ADR-04) — sem isso o browser descarta o Set-Cookie em requests CORS.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('AnimeWeek API')
    .setVersion('0.0.1')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
