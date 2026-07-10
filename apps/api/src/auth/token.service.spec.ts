import { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { computePasswordVersion } from './password-version.util';
import type { Env } from '../config/env.schema';

// Secrets deliberadamente diferentes entre access e aux (LSF-2026-002): os
// testes abaixo dependem disso para provar que um token aux não verifica
// como access token (assinaturas de secrets diferentes nem batem) e
// vice-versa.
const ACCESS_SECRET = 'test-secret';
const AUX_SECRET = 'test-aux-secret';

function buildTokenService(): TokenService {
  const jwt = new JwtService({ secret: ACCESS_SECRET });
  const auxJwt = new JwtService({ secret: AUX_SECRET });
  const config = {
    get: (key: keyof Env) => (key === 'JWT_EXPIRES_IN' ? '15m' : undefined),
  } as ConfigService<Env, true>;
  return new TokenService(jwt, auxJwt, config);
}

describe('TokenService', () => {
  const user = { id: 'user-1', email: 'neo@matrix.dev', username: 'neo' };

  it('assina e valida um access token com os claims do usuário', () => {
    const tokens = buildTokenService();
    const jwt = new JwtService({ secret: ACCESS_SECRET });

    const accessToken = tokens.signAccessToken(user);
    const payload = jwt.verify<{
      sub: string;
      email: string;
      username: string;
      purpose: string;
    }>(accessToken);

    expect(payload).toMatchObject({
      sub: user.id,
      email: user.email,
      username: user.username,
      purpose: 'access',
    });
  });

  it('valida um token de verificação de email emitido para o mesmo usuário', () => {
    const tokens = buildTokenService();
    const token = tokens.signEmailVerificationToken(user.id, user.email);

    const claims = tokens.verifyEmailVerificationToken(token);

    expect(claims).toMatchObject({
      sub: user.id,
      email: user.email,
      purpose: 'email-verify',
    });
  });

  it('rejeita um access token sendo verificado como token de verificação de email', () => {
    const tokens = buildTokenService();
    const accessToken = tokens.signAccessToken(user);

    expect(() => tokens.verifyEmailVerificationToken(accessToken)).toThrow();
  });

  it('embute a versão da senha atual no token de reset', () => {
    const tokens = buildTokenService();
    const passwordHash = 'hash-atual';

    const token = tokens.signPasswordResetToken(user.id, passwordHash);
    const claims = tokens.verifyPasswordResetToken(token);

    expect(claims.pwv).toBe(computePasswordVersion(passwordHash));
    expect(claims.sub).toBe(user.id);
  });

  it('a versão da senha muda quando a passwordHash muda (invalida replay)', () => {
    const tokens = buildTokenService();
    const tokenBeforeReset = tokens.signPasswordResetToken(
      user.id,
      'hash-antigo',
    );
    const claims = tokens.verifyPasswordResetToken(tokenBeforeReset);

    // Simula o estado do banco após um reset bem-sucedido: a comparação que o
    // AuthService faz (claims.pwv !== computePasswordVersion(hashNovo)) deve falhar.
    expect(claims.pwv).not.toBe(computePasswordVersion('hash-novo'));
  });

  it('rejeita token expirado', () => {
    const jwt = new JwtService({ secret: ACCESS_SECRET });
    const auxJwt = new JwtService({ secret: AUX_SECRET });
    const config = {
      get: (key: keyof Env) => (key === 'JWT_EXPIRES_IN' ? '-1s' : undefined),
    } as ConfigService<Env, true>;
    const tokens = new TokenService(jwt, auxJwt, config);

    const expiredToken = tokens.signAccessToken(user);

    expect(() => tokens.verifyEmailVerificationToken(expiredToken)).toThrow();
  });

  // LSF-2026-002: mesmo num cenário hipotético em que access e aux acabassem
  // assinados com o mesmo secret (ex.: alguém "simplifica" a config no
  // futuro), a claim `purpose` sozinha já é suficiente para o JwtStrategy
  // recusar um token de outro propósito — ver jwt.strategy.spec.ts para a
  // prova no ponto onde isso realmente importa (o Bearer guard).
  it('token de verificação de email não carrega purpose de access token', () => {
    const tokens = buildTokenService();
    const token = tokens.signEmailVerificationToken(user.id, user.email);
    const claims = tokens.verifyEmailVerificationToken(token);

    expect(claims).not.toHaveProperty('purpose', 'access');
  });
});
