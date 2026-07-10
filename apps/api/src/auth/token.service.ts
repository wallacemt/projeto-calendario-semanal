import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Env } from '../config/env.schema';
import { computePasswordVersion } from './password-version.util';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from './types/jwt-payload.type';

const EMAIL_VERIFICATION_EXPIRES_IN = '1d';
const PASSWORD_RESET_EXPIRES_IN = '1h';

// Token do provider registrado em AuthModule para o JwtService assinado com
// JWT_AUX_SECRET (LSF-2026-002/005) — usado pelos tokens de verify-email,
// password-reset e oauth-state. Fica aqui (não num arquivo à parte) porque é
// só consumido dentro do módulo auth.
export const JWT_AUX_SERVICE = 'JWT_AUX_SERVICE';

interface EmailVerificationClaims {
  sub: string;
  email: string;
  purpose: 'email-verify';
}

interface PasswordResetClaims {
  sub: string;
  pwv: string;
  purpose: 'password-reset';
}

// Responsável só por assinar/verificar JWTs (access, verificação de email,
// reset de senha). Não conhece Prisma nem regra de negócio — quem decide o
// que fazer com um payload inválido é o AuthService.
//
// Dois JwtService distintos de propósito (LSF-2026-002/005): `jwt` (injetado
// via DI, assinado com JWT_SECRET) só serve o access token, o mesmo que o
// JwtStrategy usa para validar o Bearer token. `auxJwt` (JWT_AUX_SECRET) serve
// os tokens de vida mais longa (verify-email 1d, password-reset 1h). Secretos
// diferentes por design: assim um token aux vazado (ou um bug que esqueça de
// checar a claim `purpose`) nunca é aceitável como access token — a
// verificação de assinatura já falha antes de qualquer claim ser lida.
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(JWT_AUX_SERVICE) private readonly auxJwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  signAccessToken(user: AuthenticatedUser): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      purpose: 'access',
    };
    return this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }),
    });
  }

  signEmailVerificationToken(userId: string, email: string): string {
    const claims: EmailVerificationClaims = {
      sub: userId,
      email,
      purpose: 'email-verify',
    };
    return this.auxJwt.sign(claims, {
      expiresIn: EMAIL_VERIFICATION_EXPIRES_IN,
    });
  }

  /** @throws {Error} token ausente, expirado, assinatura inválida ou de outro propósito. */
  verifyEmailVerificationToken(token: string): EmailVerificationClaims {
    const claims = this.auxJwt.verify<EmailVerificationClaims>(token);
    if (claims.purpose !== 'email-verify') {
      throw new Error('Token não é de verificação de email');
    }
    return claims;
  }

  signPasswordResetToken(
    userId: string,
    currentPasswordHash: string | null,
  ): string {
    const claims: PasswordResetClaims = {
      sub: userId,
      pwv: computePasswordVersion(currentPasswordHash),
      purpose: 'password-reset',
    };
    return this.auxJwt.sign(claims, { expiresIn: PASSWORD_RESET_EXPIRES_IN });
  }

  /**
   * Só confere assinatura/expiração/propósito do JWT — a checagem de
   * "já foi usado" (comparar `pwv` com a passwordHash atual no banco) é
   * responsabilidade do AuthService, que é quem tem acesso ao Prisma.
   * @throws {Error} token ausente, expirado, assinatura inválida ou de outro propósito.
   */
  verifyPasswordResetToken(token: string): PasswordResetClaims {
    const claims = this.auxJwt.verify<PasswordResetClaims>(token);
    if (claims.purpose !== 'password-reset') {
      throw new Error('Token não é de redefinição de senha');
    }
    return claims;
  }
}
