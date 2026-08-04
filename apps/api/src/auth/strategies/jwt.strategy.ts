import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../../config/env.schema';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  // O retorno vira req.user (ver CurrentUser decorator). Nenhuma consulta ao
  // banco aqui de propósito: o access token já carrega tudo que a maioria das
  // rotas precisa, mantendo a validação O(1) e sem I/O no caminho quente.
  //
  // LSF-2026-002: passport-jwt só confere assinatura/expiração, não "para que
  // este token serve" — sem checar `purpose`, qualquer JWT assinado com
  // JWT_SECRET seria aceito aqui como Bearer token. Agora isso já não basta
  // sozinho (verify-email/reset/oauth-state migraram para JWT_AUX_SECRET, ver
  // TokenService), mas a claim continua sendo a defesa correta: é o único
  // jeito de o Bearer guard recusar um JWT de outro propósito que por algum
  // motivo tenha sido assinado com o mesmo secret.
  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (payload.purpose !== 'access') {
      throw new UnauthorizedException('Token não é um access token válido');
    }
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}
