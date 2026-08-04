import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { hashRefreshToken } from './refresh-token.util';
import type { Env } from '../config/env.schema';
import { AuthProvider } from '../../generated/prisma/client';
import type { NormalizedOAuthProfile } from './types/oauth-profile.type';

// Rotação/revogação de refresh token é a lógica mais sensível do módulo
// (ADR-04) — este arquivo cobre só ela, com Prisma/TokenService/MailService
// mockados. Register/login/reset são fluxos mais simples, já exercitados
// indiretamente pelos testes de password.util e token.service.

function buildAuthService() {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    oAuthAccount: { findUnique: jest.fn(), create: jest.fn() },
  };
  const tokens = {
    signAccessToken: jest.fn(() => 'access-token'),
    signEmailVerificationToken: jest.fn(),
    signPasswordResetToken: jest.fn(),
    verifyEmailVerificationToken: jest.fn(),
    verifyPasswordResetToken: jest.fn(),
  };
  const mail = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
  const config = {
    get: (key: keyof Env) =>
      key === 'JWT_REFRESH_EXPIRES_IN_DAYS' ? 7 : undefined,
  } as ConfigService<Env, true>;

  const auth = new AuthService(
    prisma as never,
    tokens as never,
    mail as never,
    config,
  );
  return { auth, prisma };
}

const user = {
  id: 'user-1',
  email: 'neo@matrix.dev',
  username: 'neo',
  passwordHash: 'hash',
  avatarUrl: null,
  bio: null,
  emailVerified: false,
  createdAt: new Date(),
};

describe('AuthService.refresh', () => {
  it('rejeita quando não há refresh token', async () => {
    const { auth } = buildAuthService();
    await expect(auth.refresh(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita token desconhecido', async () => {
    const { auth, prisma } = buildAuthService();
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(auth.refresh('token-cru')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rotaciona: revoga o token usado e emite um novo', async () => {
    const { auth, prisma } = buildAuthService();
    const rawToken = 'token-cru';
    const record = {
      id: 'rt-1',
      userId: user.id,
      tokenHash: hashRefreshToken(rawToken),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    prisma.refreshToken.findUnique.mockResolvedValue(record);
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.refreshToken.update.mockResolvedValue({
      ...record,
      revokedAt: new Date(),
    });
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await auth.refresh(rawToken);

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: record.id },
      data: { revokedAt: expect.any(Date) as Date },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
  });

  it('reuse detection: token já revogado revoga toda a sessão do usuário', async () => {
    const { auth, prisma } = buildAuthService();
    const rawToken = 'token-cru';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: user.id,
      tokenHash: hashRefreshToken(rawToken),
      revokedAt: new Date(), // já foi usado antes
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(auth.refresh(rawToken)).rejects.toThrow(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) as Date },
    });
  });

  it('rejeita token expirado', async () => {
    const { auth, prisma } = buildAuthService();
    const rawToken = 'token-cru';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: user.id,
      tokenHash: hashRefreshToken(rawToken),
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(auth.refresh(rawToken)).rejects.toThrow(UnauthorizedException);
  });
});

// LSF-2026-001: linking automático de uma OAuthAccount nova a um User local
// já existente (achado por email) só pode acontecer se o provider comprova a
// posse do email — senão qualquer um que "possua" (sem confirmar) o mesmo
// email de uma conta com senha herdaria a sessão dela.
describe('AuthService.loginWithOAuth — account linking', () => {
  const oauthProfile: NormalizedOAuthProfile = {
    providerAccountId: 'gh-123',
    email: user.email,
    displayName: 'Neo',
    emailVerifiedByProvider: true,
  };

  it('recusa o linking quando o email não é comprovadamente verificado pelo provider', async () => {
    const { auth, prisma } = buildAuthService();
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(user); // conta local com passwordHash

    const unverifiedProfile: NormalizedOAuthProfile = {
      ...oauthProfile,
      emailVerifiedByProvider: false,
    };

    await expect(
      auth.loginWithOAuth(AuthProvider.GITHUB, unverifiedProfile),
    ).rejects.toThrow(ConflictException);
    expect(prisma.oAuthAccount.create).not.toHaveBeenCalled();
  });

  it('vincula normalmente quando o provider comprova a posse do email', async () => {
    const { auth, prisma } = buildAuthService();
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.oAuthAccount.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({ ...user, emailVerified: true });
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await auth.loginWithOAuth(AuthProvider.GITHUB, oauthProfile);

    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
      data: {
        provider: AuthProvider.GITHUB,
        providerAccountId: oauthProfile.providerAccountId,
        userId: user.id,
      },
    });
    expect(result.accessToken).toBe('access-token');
  });

  it('conta sem senha (só-OAuth) não é bloqueada mesmo com email não verificado', async () => {
    const { auth, prisma } = buildAuthService();
    const oauthOnlyUser = { ...user, passwordHash: null };
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(oauthOnlyUser);
    prisma.oAuthAccount.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({
      ...oauthOnlyUser,
      emailVerified: true,
    });
    prisma.refreshToken.create.mockResolvedValue({});

    const unverifiedProfile: NormalizedOAuthProfile = {
      ...oauthProfile,
      emailVerifiedByProvider: false,
    };

    await expect(
      auth.loginWithOAuth(AuthProvider.GITHUB, unverifiedProfile),
    ).resolves.toBeDefined();
    expect(prisma.oAuthAccount.create).toHaveBeenCalled();
  });
});
