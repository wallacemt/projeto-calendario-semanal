import { setDefaultResultOrder } from 'node:dns';
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Happy Eyeballs (RFC 8305): o Node tenta IPv4 e IPv6 e usa o que conectar
// primeiro, com só 250ms (default) por tentativa antes de partir pra próxima
// família. Em rede virtualizada (WSL2/Docker Desktop) o handshake real pode
// passar de 1s (NAT da interface virtual) — o timeout curto derruba a
// tentativa antes dela completar, e todas as famílias de endereço acabam
// esgotadas mesmo com o host acessível (é isso que aparecia como "Jikan
// falhou ao conectar", mas é falha de conexão local, não do Jikan/MAL).
setDefaultAutoSelectFamilyAttemptTimeout(3_000);
// api.jikan.moe resolve tanto A (IPv4) quanto AAAA (IPv6). Em várias redes
// dev (WSL2 incluso) a rota IPv6 pública não existe de verdade — o pacote
// nem chega a ser recusado, só some (blackhole), o que é pior que uma
// recusa instantânea: o Happy Eyeballs acima ainda gasta o timeout inteiro
// tentando essa perna antes de cair pro IPv4 que de fato funciona. Preferir
// IPv4 na ordem de resolução evita pagar esse imposto em toda chamada ao
// Jikan — continua tentando IPv6 como fallback se o IPv4 falhar.
setDefaultResultOrder('ipv4first');

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
