import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type * as OAuth2Strategy from 'passport-oauth2';
import type { Request } from 'express';
import type { Env } from '../../config/env.schema';
import { JWT_AUX_SERVICE } from '../token.service';

interface OAuthStateClaims {
  purpose: 'oauth-state';
  /** Ver LSF-2026-003 — amarra o state a quem iniciou o fluxo. */
  nonce: string;
}

const OAUTH_STATE_EXPIRES_IN = '10m';
const NONCE_COOKIE_NAME = 'oauth_nonce';
const NONCE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
// Cobre /auth/oauth/:provider (emite) e /auth/oauth/:provider/callback
// (confere) sem vazar o cookie para o resto da API.
const NONCE_COOKIE_PATH = '/auth/oauth';

// Proteção CSRF do fluxo OAuth (ADR-11) sem express-session: o "state" é um
// JWT curto assinado com JWT_AUX_SECRET (LSF-2026-002/005, não mais o mesmo
// segredo do access token). store() apenas emite o token (nada fica guardado
// no servidor); verify() confere assinatura e validade. Implementa a
// interface StateStore do passport-oauth2, que exige as variantes com/sem
// `meta` — não as usamos, mas a assinatura precisa aceitar as duas para
// satisfazer o tipo.
//
// LSF-2026-003: um JWT válido sozinho não prova que foi *este* browser quem
// iniciou o fluxo — qualquer state assinado pelo servidor passava, o que
// permite login-CSRF (atacante inicia o fluxo com sua própria conta, captura
// code+state, e induz a vítima a abrir esse callback — a vítima acaba logada
// na conta do atacante sem perceber). A defesa clássica é "double submit":
// um nonce aleatório vai tanto no `state` (JWT, viaja pela URL) quanto num
// cookie httpOnly (não pode ser lido/forjado por JS nem por um link
// arbitrário) — só quem tem os dois, o browser que de fato iniciou o fluxo,
// passa na verificação.
@Injectable()
export class OAuthStateStore implements OAuth2Strategy.StateStore {
  constructor(
    @Inject(JWT_AUX_SERVICE) private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  store(req: Request, callback: OAuth2Strategy.StateStoreStoreCallback): void;
  store(
    req: Request,
    meta: OAuth2Strategy.Metadata,
    callback: OAuth2Strategy.StateStoreStoreCallback,
  ): void;
  store(
    req: Request,
    metaOrCallback:
      OAuth2Strategy.Metadata | OAuth2Strategy.StateStoreStoreCallback,
    maybeCallback?: OAuth2Strategy.StateStoreStoreCallback,
  ): void {
    const callback =
      maybeCallback ??
      (metaOrCallback as OAuth2Strategy.StateStoreStoreCallback);
    const nonce = randomBytes(16).toString('hex');
    this.setNonceCookie(req, nonce);
    const claims: OAuthStateClaims = { purpose: 'oauth-state', nonce };
    const state = this.jwt.sign(claims, { expiresIn: OAUTH_STATE_EXPIRES_IN });
    callback(null, state);
  }

  verify(
    req: Request,
    state: string,
    callback: OAuth2Strategy.StateStoreVerifyCallback,
  ): void;
  verify(
    req: Request,
    state: string,
    meta: OAuth2Strategy.Metadata,
    callback: OAuth2Strategy.StateStoreVerifyCallback,
  ): void;
  verify(
    req: Request,
    state: string,
    metaOrCallback:
      OAuth2Strategy.Metadata | OAuth2Strategy.StateStoreVerifyCallback,
    maybeCallback?: OAuth2Strategy.StateStoreVerifyCallback,
  ): void {
    const callback =
      maybeCallback ??
      (metaOrCallback as OAuth2Strategy.StateStoreVerifyCallback);
    // Cookie de curta duração, uso único: some do request depois deste
    // callback, tenha o state passado ou não na verificação de nonce.
    const cookieNonce = this.readNonceCookie(req);
    this.clearNonceCookie(req);
    try {
      const claims = this.jwt.verify<OAuthStateClaims>(state);
      if (
        claims.purpose !== 'oauth-state' ||
        !cookieNonce ||
        claims.nonce !== cookieNonce
      ) {
        callback(null, false, 'state inválido');
        return;
      }
      callback(null, true, undefined);
    } catch {
      callback(null, false, 'state inválido ou expirado');
    }
  }

  private setNonceCookie(req: Request, nonce: string): void {
    req.res?.cookie(NONCE_COOKIE_NAME, nonce, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax', // ver comentário da classe — Strict não sobrevive ao
      // redirect top-level cross-site que o provider faz de volta ao callback
      path: NONCE_COOKIE_PATH,
      maxAge: NONCE_COOKIE_MAX_AGE_MS,
    });
  }

  private readNonceCookie(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[
      NONCE_COOKIE_NAME
    ];
  }

  private clearNonceCookie(req: Request): void {
    req.res?.clearCookie(NONCE_COOKIE_NAME, { path: NONCE_COOKIE_PATH });
  }
}
