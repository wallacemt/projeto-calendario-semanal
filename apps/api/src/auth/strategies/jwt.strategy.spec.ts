import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import type { Env } from '../../config/env.schema';
import type { AccessTokenPayload } from '../types/jwt-payload.type';

// LSF-2026-002: o JwtStrategy é o único ponto que decide se um JWT vale como
// sessão autenticada (é ele quem o JwtAuthGuard chama). Sem checar `purpose`,
// qualquer token assinado com JWT_SECRET — inclusive um de verify-email/reset
// que por algum motivo tivesse esse secret — seria aceito aqui.

function buildStrategy(): JwtStrategy {
  const config = {
    get: (key: keyof Env) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
  } as ConfigService<Env, true>;
  return new JwtStrategy(config);
}

const basePayload = {
  sub: 'user-1',
  email: 'neo@matrix.dev',
  username: 'neo',
};

describe('JwtStrategy', () => {
  it('aceita um payload com purpose "access"', () => {
    const strategy = buildStrategy();
    const payload: AccessTokenPayload = { ...basePayload, purpose: 'access' };

    expect(strategy.validate(payload)).toEqual({
      id: basePayload.sub,
      email: basePayload.email,
      username: basePayload.username,
    });
  });

  it('rejeita um payload sem purpose "access" (ex.: token de outro propósito)', () => {
    const strategy = buildStrategy();
    const foreignPayload = {
      ...basePayload,
      purpose: 'email-verify',
    } as unknown as AccessTokenPayload;

    expect(() => strategy.validate(foreignPayload)).toThrow(
      UnauthorizedException,
    );
  });
});
