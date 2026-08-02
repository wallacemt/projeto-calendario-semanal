import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SharingService } from './sharing.service';

// Cobre as regras não-triviais do módulo: upsert implícito do link na 1ª
// leitura, bloqueio de auto-convite, conflito de convite duplicado (P2002),
// e o escopo por dono na revogação (mesmo padrão 404-não-403 de
// EntriesService.findOwned) — é exatamente essa checagem que protege contra
// alguém revogar o convite de outra pessoa só adivinhando o id.

function buildSharingService() {
  const prisma = {
    calendarShare: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    shareGrant: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    user: { findUnique: jest.fn() },
    calendar: { findUnique: jest.fn() },
  };
  const sharing = new SharingService(prisma as never);
  return { sharing, prisma };
}

const baseShare = {
  id: 'share-1',
  userId: 'user-1',
  token: 'tok-1',
  active: true,
  createdAt: new Date(),
  grants: [] as unknown[],
};

describe('SharingService', () => {
  it('getStatus cria o link automaticamente na 1ª leitura (upsert implícito)', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.calendarShare.findUnique.mockResolvedValue(null);
    prisma.calendarShare.create.mockResolvedValue(baseShare);

    const status = await sharing.getStatus('user-1');

    expect(prisma.calendarShare.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 'user-1' } }),
    );
    expect(status.active).toBe(true);
    expect(status.token).toBe('tok-1');
  });

  it('toggle inverte o active existente sem recriar o registro', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.calendarShare.findUnique.mockResolvedValue(baseShare);
    prisma.calendarShare.update.mockResolvedValue({
      ...baseShare,
      active: false,
    });

    const status = await sharing.toggle('user-1');

    expect(prisma.calendarShare.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'share-1' },
        data: { active: false },
      }),
    );
    expect(status.active).toBe(false);
  });

  it('invite rejeita convidar a si mesmo', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'wallacemt',
    });

    await expect(sharing.invite('user-1', 'wallacemt')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.shareGrant.create).not.toHaveBeenCalled();
  });

  it('invite rejeita username inexistente com 404', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(sharing.invite('user-1', 'ninguem')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('invite mapeia convite duplicado (P2002) para 409', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      username: 'kaiofz',
    });
    prisma.calendarShare.findUnique.mockResolvedValue(baseShare);
    prisma.shareGrant.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(sharing.invite('user-1', 'kaiofz')).rejects.toThrow(
      ConflictException,
    );
  });

  it('revokeGrant rejeita com 404 se o convite não pertence ao dono do link', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.shareGrant.findFirst.mockResolvedValue(null);

    await expect(sharing.revokeGrant('grant-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.shareGrant.findFirst).toHaveBeenCalledWith({
      where: { id: 'grant-1', share: { userId: 'user-1' } },
    });
    expect(prisma.shareGrant.delete).not.toHaveBeenCalled();
  });

  it('revokeGrant remove quando o convite pertence ao dono do link', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.shareGrant.findFirst.mockResolvedValue({ id: 'grant-1' });

    await sharing.revokeGrant('grant-1', 'user-1');

    expect(prisma.shareGrant.delete).toHaveBeenCalledWith({
      where: { id: 'grant-1' },
    });
  });

  it('getPublicBoard rejeita com 404 quando o link está desativado', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.calendarShare.findUnique.mockResolvedValue({
      ...baseShare,
      active: false,
    });

    await expect(sharing.getPublicBoard('tok-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.calendar.findUnique).not.toHaveBeenCalled();
  });

  it('getPublicBoard rejeita com 404 quando não existe calendário na estação atual', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.calendarShare.findUnique.mockResolvedValue(baseShare);
    prisma.calendar.findUnique.mockResolvedValue(null);

    await expect(sharing.getPublicBoard('tok-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getPublicBoard identifica o dono do calendário na resposta (username/avatar/bio)', async () => {
    const { sharing, prisma } = buildSharingService();
    prisma.calendarShare.findUnique.mockResolvedValue({
      ...baseShare,
      user: {
        username: 'wallacemt',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'Assistindo tudo que rola.',
      },
    });
    prisma.calendar.findUnique.mockResolvedValue({
      id: 'cal-1',
      season: 'SUMMER',
      year: 2026,
      createdAt: new Date(),
      entries: [],
    });

    const board = await sharing.getPublicBoard('tok-1');

    expect(board.owner).toEqual({
      username: 'wallacemt',
      avatarUrl: 'https://example.com/avatar.png',
      bio: 'Assistindo tudo que rola.',
    });
  });
});
