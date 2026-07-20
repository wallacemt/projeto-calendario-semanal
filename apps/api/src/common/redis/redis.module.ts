import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Env } from '../../config/env.schema';

export const REDIS_CLIENT = 'REDIS_CLIENT';

// Redis não tem integração oficial no Nest (ao contrário de TypeORM/Mongoose),
// então o padrão de mercado é um custom provider: um token (REDIS_CLIENT) +
// useFactory que constrói o client uma vez e o disponibiliza via DI — mesmo
// truque usado para qualquer SDK de terceiro (ex.: cliente do Supabase).
// REDIS_URL é opcional (env.schema.ts): sem ela o client é null e quem
// consome pula o cache em vez de derrubar o boot — mesma degradação graciosa
// já usada para Resend/OAuth neste projeto.
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService<Env, true>) => {
        const url = config.get('REDIS_URL', { infer: true });
        return url ? new Redis(url) : null;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
