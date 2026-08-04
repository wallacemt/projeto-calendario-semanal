import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import type { Env } from '../../config/env.schema';
import type { NormalizedOAuthProfile } from '../types/oauth-profile.type';
import { OAuthStateStore } from './oauth-state.store';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<Env, true>, stateStore: OAuthStateStore) {
    super({
      // Fallback 'unconfigured': sem isso o Passport lança na construção e
      // derruba o boot inteiro quando o provider não está configurado — quem
      // barra a rota nesse caso é o GoogleAuthGuard (503), não o bootstrap.
      clientID:
        config.get('GOOGLE_CLIENT_ID', { infer: true }) ?? 'unconfigured',
      clientSecret:
        config.get('GOOGLE_CLIENT_SECRET', { infer: true }) ?? 'unconfigured',
      callbackURL: '/auth/oauth/google/callback',
      scope: ['email', 'profile'],
      store: stateStore,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException('Conta Google sem email público.'));
      return;
    }
    // LSF-2026-001: o endpoint OpenID Connect que o passport-google-oauth20
    // usa por padrão devolve `email_verified` (exposto aqui como
    // `emails[0].verified`) — um Google Workspace de domínio próprio pode ter
    // o email ainda não verificado. Sem essa checagem, bastaria alguém
    // "possuir" (ainda que sem confirmar) um email igual ao de uma conta
    // local para herdar a sessão dela via linking automático no AuthService.
    if (profile.emails?.[0]?.verified !== true) {
      done(
        new UnauthorizedException(
          'Email da conta Google ainda não foi verificado pelo Google.',
        ),
      );
      return;
    }
    const normalized: NormalizedOAuthProfile = {
      providerAccountId: profile.id,
      email,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
      emailVerifiedByProvider: true,
    };
    done(null, normalized);
  }
}
