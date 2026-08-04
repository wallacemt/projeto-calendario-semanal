import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntryStatus, Prisma } from '../../generated/prisma/client';
import { MuseumService } from './museum.service';

// Cobre a agregação de stats() (RF-10) — a parte não-trivial do módulo
// (ranking de gêneros, bucket mensal, média/semana) — e o scoping por dono
// em remove().

function buildMuseumService() {
  const prisma = {
    watchedAnime: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    anime: { findUniqueOrThrow: jest.fn() },
    calendarEntry: { groupBy: jest.fn() },
    user: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  };
  // Sem featuredWatchedAnimeId setado e sem nenhum watched — o "modo auto"
  // (resolveFeaturedId) usado por findAll/create/update/setFeatured.
  prisma.user.findUniqueOrThrow.mockResolvedValue({
    featuredWatchedAnimeId: null,
  });
  prisma.watchedAnime.findFirst.mockResolvedValue(null);
  const animes = { getByMalId: jest.fn() };
  const museum = new MuseumService(prisma as never, animes as never);
  return { museum, prisma, animes };
}

describe('MuseumService', () => {
  it('stats calcula nota média, horas totais e ranking de gêneros', async () => {
    const { museum, prisma } = buildMuseumService();
    const now = new Date();
    prisma.watchedAnime.findMany.mockResolvedValue([
      {
        rating: 10,
        completedAt: now,
        anime: { episodes: 12, genres: ['Ação', 'Aventura'] },
      },
      {
        rating: 8,
        completedAt: now,
        anime: { episodes: 24, genres: ['Ação'] },
      },
    ]);
    prisma.calendarEntry.groupBy.mockResolvedValue([
      { status: EntryStatus.WATCHING, _count: 3 },
    ]);

    const stats = await museum.stats('user-1');

    expect(stats.totalWatched).toBe(2);
    expect(stats.avgRating).toBe(9);
    expect(stats.totalHours).toBe(Math.round(((12 + 24) * 24) / 60));
    expect(stats.genreRanking[0]).toEqual({
      name: 'Ação',
      count: 2,
      pct: 66.7,
    });
    expect(stats.statusBreakdown).toEqual([{ status: 'WATCHING', count: 3 }]);
  });

  it('stats devolve avgRating null e listas vazias sem nenhum registro', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.findMany.mockResolvedValue([]);
    prisma.calendarEntry.groupBy.mockResolvedValue([]);

    const stats = await museum.stats('user-1');

    expect(stats.totalWatched).toBe(0);
    expect(stats.avgRating).toBeNull();
    expect(stats.episodesPerWeek).toBe(0);
    expect(stats.genreRanking).toEqual([]);
    expect(stats.monthly).toHaveLength(12);
  });

  it('createFromAnimeId mapeia violação de @@unique([userId, animeId]) (P2002) para 409', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      museum.createFromAnimeId('user-1', 'anime-1', { rating: 9 }),
    ).rejects.toThrow(ConflictException);
  });

  it('remove rejeita com 404 se o registro não é do usuário', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.findFirst.mockResolvedValue(null);

    await expect(museum.remove('w-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.watchedAnime.delete).not.toHaveBeenCalled();
  });

  it('findAll marca como featured o mais recente quando ninguém foi fixado (modo auto)', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.findMany.mockResolvedValue([
      { id: 'w-recent', anime: {} },
      { id: 'w-old', anime: {} },
    ]);
    // resolveFeaturedId: sem featuredWatchedAnimeId -> cai pro findFirst
    // (completedAt desc) — o mock global de findFirst já devolve null por
    // padrão, então precisa ser explicitado aqui pra simular "achou o mais recente".
    prisma.watchedAnime.findFirst.mockResolvedValue({ id: 'w-recent' });

    const result = await museum.findAll('user-1');

    expect(result.find((w) => w.id === 'w-recent')?.featured).toBe(true);
    expect(result.find((w) => w.id === 'w-old')?.featured).toBe(false);
  });

  it('setFeatured fixa um item do próprio usuário', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.findFirst.mockResolvedValue({ id: 'w-1' });

    const result = await museum.setFeatured('user-1', 'w-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { featuredWatchedAnimeId: 'w-1' },
    });
    expect(result).toEqual({ featuredWatchedAnimeId: 'w-1' });
  });

  it('setFeatured rejeita com 404 se o item não é do usuário', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.findFirst.mockResolvedValue(null);

    await expect(museum.setFeatured('user-1', 'w-alheio')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('setFeatured com null volta pro modo auto sem checar dono', async () => {
    const { museum, prisma } = buildMuseumService();

    const result = await museum.setFeatured('user-1', null);

    expect(prisma.watchedAnime.findFirst).not.toHaveBeenCalled();
    expect(result).toEqual({ featuredWatchedAnimeId: null });
  });

  it('update permite limpar rating/comment com null explícito', async () => {
    const { museum, prisma } = buildMuseumService();
    prisma.watchedAnime.findFirst.mockResolvedValue({ id: 'w-1' });
    prisma.watchedAnime.update.mockResolvedValue({ id: 'w-1', anime: {} });

    await museum.update('w-1', 'user-1', { rating: null, comment: null });

    expect(prisma.watchedAnime.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'w-1' },
        data: expect.objectContaining({ rating: null, comment: null }),
      }),
    );
  });
});
