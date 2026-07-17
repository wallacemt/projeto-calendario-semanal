import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthProvider } from '../../generated/prisma/client';

// Cobre as duas regras não-triviais do módulo: unicidade de username no
// PATCH (check-then-act, mesmo padrão do AuthService.register) e a rejeição
// de arquivo que não é uma imagem de verdade no upload de avatar (Lawliet:
// não confiar em mimetype/extensão — ver users.service.ts).

function buildUsersService() {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const storage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getPublicUrl: jest.fn(() => 'https://storage.example/avatars/user-1.webp'),
  };
  const users = new UsersService(prisma as never, storage);
  return { users, prisma, storage };
}

const baseUser = {
  id: 'user-1',
  email: 'wallace@email.com',
  username: 'wallacemt',
  passwordHash: null,
  avatarUrl: null,
  bio: null,
  emailVerified: true,
  createdAt: new Date('2025-03-01'),
  oauthAccounts: [
    {
      id: 'oauth-1',
      userId: 'user-1',
      provider: AuthProvider.GOOGLE,
      providerAccountId: 'g-1',
    },
  ],
};

describe('UsersService', () => {
  it('getProfile mapeia oauthAccounts para connectedProviders e zera stats (sem Calendar no schema)', async () => {
    const { users, prisma } = buildUsersService();
    prisma.user.findUnique.mockResolvedValue(baseUser);

    const profile = await users.getProfile('user-1');

    expect(profile.connectedProviders).toEqual([AuthProvider.GOOGLE]);
    expect(profile.stats).toEqual({ totalAnimesInCalendar: 0 });
  });

  it('updateProfile rejeita username já usado por outro usuário', async () => {
    const { users, prisma } = buildUsersService();
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, id: 'other-user' });

    await expect(
      users.updateProfile('user-1', { username: 'ocupado' }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('uploadAvatar rejeita buffer que não decodifica como imagem', async () => {
    const { users, storage } = buildUsersService();
    const notAnImage = Buffer.from('isso não é um png de verdade');

    await expect(
      users.uploadAvatar('user-1', {
        buffer: notAnImage,
      } as Express.Multer.File),
    ).rejects.toThrow(ConflictException);
    expect(storage.upload).not.toHaveBeenCalled();
  });
});
