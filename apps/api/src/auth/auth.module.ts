import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Env } from '../config/env.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MailService } from './mail/mail.service';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OAuthStateStore } from './strategies/oauth-state.store';
import { JWT_AUX_SERVICE, TokenService } from './token.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    MailService,
    OAuthStateStore,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // JwtService dedicado aos tokens auxiliares (LSF-2026-002/005) — secret
    // diferente do access token (registrado acima via JwtModule.registerAsync
    // com JWT_SECRET). Provider manual em vez de um segundo JwtModule porque
    // só precisamos da instância, não do resto do que o módulo expõe.
    {
      provide: JWT_AUX_SERVICE,
      useFactory: (config: ConfigService<Env, true>) =>
        new JwtService({
          secret: config.get('JWT_AUX_SECRET', { infer: true }),
        }),
      inject: [ConfigService],
    },
  ],
})
export class AuthModule {}
