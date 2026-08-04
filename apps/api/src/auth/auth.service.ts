import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { AuthProvider, type User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail/mail.service';
import { computePasswordVersion } from './password-version.util';
import { hashPassword, verifyPassword } from './password.util';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.util';
import { TokenService } from './token.service';
import { toPublicUser, type PublicUser } from './types/public-user.type';
import type { NormalizedOAuthProfile } from './types/oauth-profile.type';
import type { LoginInput, RegisterInput } from '@aniweek/shared';

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RefreshedSession {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

const USERNAME_SEED_MAX_LENGTH = 15;
const USERNAME_GENERATION_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(input: RegisterInput): Promise<AuthSession> {
    const [emailTaken, usernameTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: input.email } }),
      this.prisma.user.findUnique({ where: { username: input.username } }),
    ]);
    if (emailTaken) throw new ConflictException('Email já cadastrado');
    if (usernameTaken) throw new ConflictException('Usuário já em uso');

    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: { email: input.email, username: input.username, passwordHash },
    });

    // ADR-05: verificação de email é best-effort/assíncrona — nunca bloqueia
    // nem derruba o registro se o envio falhar (MailService já trata isso).
    const verificationToken = this.tokens.signEmailVerificationToken(
      user.id,
      user.email,
    );
    void this.mail.sendVerificationEmail(user.email, verificationToken);

    const session = await this.issueTokens(user);
    return { user: toPublicUser(user), ...session };
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    // Mensagem genérica de propósito: não revela se o email existe nem se a
    // conta é só-OAuth (sem passwordHash) — evita enumeração de contas.
    if (!user?.passwordHash)
      throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Credenciais inválidas');

    const session = await this.issueTokens(user);
    return { user: toPublicUser(user), ...session };
  }

  async refresh(rawToken: string | undefined): Promise<RefreshedSession> {
    if (!rawToken) throw new UnauthorizedException('Refresh token ausente');

    const tokenHash = hashRefreshToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!existing) throw new UnauthorizedException('Refresh token inválido');

    if (existing.revokedAt) {
      // Reuse detection: um refresh token já revogado sendo reapresentado é
      // sinal de token roubado/vazado — revoga toda a sessão do usuário.
      await this.revokeAllRefreshTokens(existing.userId);
      throw new UnauthorizedException(
        'Refresh token comprometido — sessão revogada',
      );
    }
    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existing.userId },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashRefreshToken(rawToken);
    // updateMany em vez de update: idempotente mesmo se o token não existir
    // (não lança se 0 linhas afetadas).
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const claims = this.tryVerify(() =>
      this.tokens.verifyEmailVerificationToken(token),
    );
    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
    });
    if (!user || user.email !== claims.email) {
      throw new BadRequestException('Token inválido ou expirado');
    }
    if (!user.emailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Conta inexistente ou só-OAuth (sem passwordHash): não há o que resetar,
    // mas o endpoint sempre "sucede" do ponto de vista do chamador (evita
    // enumeração de contas) — ver AuthController.
    if (!user?.passwordHash) return;

    const resetToken = this.tokens.signPasswordResetToken(
      user.id,
      user.passwordHash,
    );
    void this.mail.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const claims = this.tryVerify(() =>
      this.tokens.verifyPasswordResetToken(token),
    );

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
    });
    if (!user) throw new BadRequestException('Token inválido ou expirado');
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Esta conta usa login social e não possui senha para redefinir',
      );
    }
    if (claims.pwv !== computePasswordVersion(user.passwordHash)) {
      // Senha já foi trocada desde a emissão do token — replay de token usado.
      throw new BadRequestException('Token inválido ou expirado');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    // Troca de senha derruba todas as sessões ativas (refresh tokens antigos).
    await this.revokeAllRefreshTokens(user.id);
  }

  async loginWithOAuth(
    provider: AuthProvider,
    profile: NormalizedOAuthProfile,
  ): Promise<AuthSession> {
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });
    if (existingAccount) {
      const session = await this.issueTokens(existingAccount.user);
      return { user: toPublicUser(existingAccount.user), ...session };
    }

    // Account linking por email (ADR-11): se já existe um User com esse
    // email (ex.: criado via registro local), vincula a nova OAuthAccount a
    // ele em vez de criar um usuário duplicado.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    // LSF-2026-001: linking automático a uma conta com senha só é seguro se o
    // provider comprova a posse do email — do contrário isso é account
    // takeover (basta "possuir" um email igual ao de alguém, sem confirmá-lo,
    // para herdar a sessão da conta dela). As strategies já filtram email não
    // verificado antes de chegar aqui; esta é a segunda camada de defesa, no
    // ponto exato onde a decisão de vincular é tomada.
    if (existingUser?.passwordHash && !profile.emailVerifiedByProvider) {
      this.logger.warn(
        `OAuth linking recusado: email ${existingUser.email} tem conta local com senha e o provider não comprova posse do email.`,
      );
      throw new ConflictException(
        'Este email já pertence a uma conta com senha. Faça login com sua senha para acessá-la.',
      );
    }

    let user = existingUser ?? (await this.createUserFromOAuth(profile));

    await this.prisma.oAuthAccount.create({
      data: {
        provider,
        providerAccountId: profile.providerAccountId,
        userId: user.id,
      },
    });

    if (existingUser && !existingUser.emailVerified) {
      // Provider já validou o email — aproveita para marcar a conta local.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const session = await this.issueTokens(user);
    return { user: toPublicUser(user), ...session };
  }

  private async createUserFromOAuth(
    profile: NormalizedOAuthProfile,
  ): Promise<User> {
    const username = await this.generateUniqueUsername(
      profile.displayName ?? profile.email.split('@')[0],
    );
    return this.prisma.user.create({
      data: {
        email: profile.email,
        username,
        emailVerified: true, // ADR-11: o provider já verificou o email
        avatarUrl: profile.avatarUrl,
      },
    });
  }

  private async generateUniqueUsername(seed: string): Promise<string> {
    const base = (
      seed
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, USERNAME_SEED_MAX_LENGTH) || 'user'
    ).padEnd(3, '0');

    let candidate = base;
    for (let attempt = 0; attempt < USERNAME_GENERATION_ATTEMPTS; attempt++) {
      const taken = await this.prisma.user.findUnique({
        where: { username: candidate },
      });
      if (!taken) return candidate;
      candidate = `${base}${randomBytes(2).toString('hex')}`;
    }
    throw new ConflictException('Não foi possível gerar um username único');
  }

  private async issueTokens(user: User): Promise<RefreshedSession> {
    const accessToken = this.tokens.signAccessToken(user);
    const { token: refreshToken, tokenHash } = generateRefreshToken();
    const refreshDays = this.config.get('JWT_REFRESH_EXPIRES_IN_DAYS', {
      infer: true,
    });
    const refreshTokenExpiresAt = new Date(
      Date.now() + refreshDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt: refreshTokenExpiresAt },
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Traduz falhas de assinatura/expiração do TokenService (Error genérico)
  // em BadRequestException — é sempre erro do chamador (token velho/adulterado).
  private tryVerify<T>(verify: () => T): T {
    try {
      return verify();
    } catch {
      throw new BadRequestException('Token inválido ou expirado');
    }
  }
}
