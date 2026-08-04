import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-github2';
import type { VerifyCallback } from 'passport-oauth2';
import type { Env } from '../../config/env.schema';
import type { NormalizedOAuthProfile } from '../types/oauth-profile.type';
import { OAuthStateStore } from './oauth-state.store';

const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

// Forma da resposta de GET /user/emails — só o que usamos.
interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService<Env, true>, stateStore: OAuthStateStore) {
    super({
      clientID:
        config.get('GITHUB_CLIENT_ID', { infer: true }) ?? 'unconfigured',
      clientSecret:
        config.get('GITHUB_CLIENT_SECRET', { infer: true }) ?? 'unconfigured',
      callbackURL: '/auth/oauth/github/callback',
      scope: ['user:email'],
      store: stateStore,
    });
  }

  // LSF-2026-001: `profile.emails[0]` (montado pelo passport-github2 a partir
  // de GET /user) é só o email público do perfil — não vem com `verified` e
  // pode nem ser o email dono da conta. Buscamos GET /user/emails (scope
  // `user:email`, pedido acima) e usamos o email `primary && verified`, que é
  // o único que o GitHub garante pertencer ao dono do token.
  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = await this.fetchVerifiedPrimaryEmail(accessToken);
      if (!email) {
        done(
          new UnauthorizedException(
            'Conta GitHub sem email primário verificado (verifique o escopo user:email).',
          ),
        );
        return;
      }
      const normalized: NormalizedOAuthProfile = {
        providerAccountId: profile.id,
        email,
        displayName: profile.username ?? profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
        emailVerifiedByProvider: true,
      };
      done(null, normalized);
    } catch (error) {
      done(
        error instanceof Error
          ? error
          : new Error('Falha ao consultar emails do GitHub'),
      );
    }
  }

  private async fetchVerifiedPrimaryEmail(
    accessToken: string,
  ): Promise<string | null> {
    const response = await fetch(GITHUB_EMAILS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'aniweek',
      },
    });
    if (!response.ok) return null;

    const emails = (await response.json()) as GithubEmail[];
    const primaryVerified = emails.find((e) => e.primary && e.verified);
    return primaryVerified?.email ?? null;
  }
}
