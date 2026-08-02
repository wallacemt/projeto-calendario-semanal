import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SocialService } from './social.service';

// Cobre as regras não-triviais: follow idempotente (não estoura em clique
// duplo), bloqueio de auto-follow, discover sem N+1 (groupBy em vez de count
// por candidato), toggle de reação (cria/remove no mesmo endpoint) e
// markRead escopado por dono (não deixa marcar notificação de outra pessoa).

function buildSocialService() {
  const prisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    follow: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    calendarEntry: { findUnique: jest.fn() },
    comment: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    reaction: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  };
  const events = { stream: jest.fn(), emit: jest.fn() };
  const museum = { stats: jest.fn().mockResolvedValue({ totalWatched: 0 }) };
  const social = new SocialService(
    prisma as never,
    events as never,
    museum as never,
  );
  return { social, prisma, events, museum };
}

describe('SocialService', () => {
  it('follow rejeita seguir a si mesmo', async () => {
    const { social, prisma } = buildSocialService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'wallacemt',
    });

    await expect(social.follow('user-1', 'wallacemt')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.follow.create).not.toHaveBeenCalled();
  });

  it('follow rejeita username inexistente com 404', async () => {
    const { social, prisma } = buildSocialService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(social.follow('user-1', 'ninguem')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('follow é idempotente — clique duplo (P2002) não lança erro nem notifica de novo', async () => {
    const { social, prisma, events } = buildSocialService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      username: 'kaiofz',
    });
    prisma.follow.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(social.follow('user-1', 'kaiofz')).resolves.toBeUndefined();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('follow cria e notifica o usuário seguido', async () => {
    const { social, prisma, events } = buildSocialService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      username: 'kaiofz',
    });
    prisma.follow.create.mockResolvedValue({ id: 'follow-1' });
    prisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      type: 'FOLLOW',
      message: 'começou a seguir você.',
      read: false,
      createdAt: new Date(),
      actor: null,
    });

    await social.follow('user-1', 'kaiofz');

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-2', actorId: 'user-1' }),
      }),
    );
    expect(events.emit).toHaveBeenCalledWith('user-2', expect.any(Object));
  });

  it('discover devolve mutualCount via 1 groupBy (sem N+1)', async () => {
    const { social, prisma } = buildSocialService();
    prisma.follow.findMany.mockResolvedValue([{ followingId: 'friend-1' }]);
    prisma.user.findMany.mockResolvedValue([
      { id: 'cand-1', username: 'rafa', avatarUrl: null },
      { id: 'cand-2', username: 'yuki', avatarUrl: null },
    ]);
    prisma.follow.groupBy.mockResolvedValue([
      { followingId: 'cand-1', _count: 3 },
    ]);

    const result = await social.discover('user-1');

    expect(prisma.follow.groupBy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: 'cand-1', username: 'rafa', avatarUrl: null, mutualCount: 3 },
      { id: 'cand-2', username: 'yuki', avatarUrl: null, mutualCount: 0 },
    ]);
  });

  it('discover pula o groupBy quando o usuário ainda não segue ninguém', async () => {
    const { social, prisma } = buildSocialService();
    prisma.follow.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([
      { id: 'cand-1', username: 'rafa', avatarUrl: null },
    ]);

    const result = await social.discover('user-1');

    expect(prisma.follow.groupBy).not.toHaveBeenCalled();
    expect(result[0].mutualCount).toBe(0);
  });

  it('markRead rejeita com 404 se a notificação não é do usuário', async () => {
    const { social, prisma } = buildSocialService();
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(social.markRead('notif-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: { read: true },
    });
  });

  it('toggleReaction cria a reação e notifica na primeira vez', async () => {
    const { social, prisma, events } = buildSocialService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      anime: { title: 'Dandadan S2' },
      calendar: { userId: 'owner-1' },
    });
    prisma.reaction.findUnique.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue({
      id: 'notif-2',
      type: 'REACTION',
      message: 'reagiu ao seu progresso em Dandadan S2.',
      read: false,
      createdAt: new Date(),
      actor: null,
    });

    const result = await social.toggleReaction('entry-1', 'user-1');

    expect(result).toEqual({ reacted: true });
    expect(prisma.reaction.create).toHaveBeenCalledWith({
      data: { entryId: 'entry-1', userId: 'user-1' },
    });
    expect(events.emit).toHaveBeenCalled();
  });

  it('toggleReaction remove a reação existente (desfaz) sem notificar', async () => {
    const { social, prisma, events } = buildSocialService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      anime: { title: 'Dandadan S2' },
      calendar: { userId: 'owner-1' },
    });
    prisma.reaction.findUnique.mockResolvedValue({ id: 'reaction-1' });

    const result = await social.toggleReaction('entry-1', 'user-1');

    expect(result).toEqual({ reacted: false });
    expect(prisma.reaction.delete).toHaveBeenCalledWith({
      where: { id: 'reaction-1' },
    });
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('toggleReaction não notifica reação no próprio card', async () => {
    const { social, prisma } = buildSocialService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      anime: { title: 'Dandadan S2' },
      calendar: { userId: 'user-1' },
    });
    prisma.reaction.findUnique.mockResolvedValue(null);

    await social.toggleReaction('entry-1', 'user-1');

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('getPublicProfile esconde stats de terceiros quando statsPublic é false', async () => {
    const { social, prisma, museum } = buildSocialService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      username: 'kaiofz',
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
      statsPublic: false,
    });
    prisma.follow.count.mockResolvedValue(0);
    prisma.follow.findUnique.mockResolvedValue(null);

    const profile = await social.getPublicProfile('kaiofz', 'user-1');

    expect(profile.stats).toBeNull();
    expect(museum.stats).not.toHaveBeenCalled();
  });

  it('getPublicProfile mostra as próprias stats mesmo com statsPublic false (dono vendo o próprio perfil)', async () => {
    const { social, prisma, museum } = buildSocialService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'wallacemt',
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
      statsPublic: false,
    });
    prisma.follow.count.mockResolvedValue(0);
    prisma.follow.findUnique.mockResolvedValue(null);

    const profile = await social.getPublicProfile('wallacemt', 'user-1');

    expect(profile.stats).not.toBeNull();
    expect(museum.stats).toHaveBeenCalledWith('user-1');
  });
});
