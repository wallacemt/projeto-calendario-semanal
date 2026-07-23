import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EntryStatus, Weekday } from '@aniweek/shared';
import { EntriesService } from './entries.service';
import { Prisma } from '../../generated/prisma/client';

// Cobre as regras não-triviais do módulo: posição no fim da coluna do dia
// (nota técnica da issue M4.2), o mapeamento P2002 -> 409 (constraint
// @@unique([calendarId, animeId])), a checagem de dono do calendário e,
// no M5, o reorder (move) e a validação de progresso (AC-06).

function buildEntriesService() {
  const prisma = {
    calendar: { findFirst: jest.fn() },
    anime: { findUniqueOrThrow: jest.fn() },
    calendarEntry: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  // Fora do literal pra não referenciar `prisma` na própria inicialização
  // (isso faz o TS cair pra `any` e o eslint reclamar em cascata).
  prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );
  const animes = { getByMalId: jest.fn() };
  const entries = new EntriesService(prisma as never, animes as never);
  return { entries, prisma, animes };
}

describe('EntriesService', () => {
  it('create posiciona a nova entrada no fim da coluna do dia', async () => {
    const { entries, prisma, animes } = buildEntriesService();
    prisma.calendar.findFirst.mockResolvedValue({
      id: 'cal-1',
      userId: 'user-1',
    });
    animes.getByMalId.mockResolvedValue({ malId: 52991, episodes: 28 });
    prisma.anime.findUniqueOrThrow.mockResolvedValue({
      id: 'anime-1',
      malId: 52991,
    });
    prisma.calendarEntry.count.mockResolvedValue(2);
    prisma.calendarEntry.create.mockResolvedValue({ id: 'entry-1' });

    await entries.create('cal-1', 'user-1', {
      malId: 52991,
      weekday: Weekday.MON,
    });

    expect(prisma.calendarEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 2 }),
      }),
    );
  });

  it('create mapeia violação de @@unique (P2002) para 409', async () => {
    const { entries, prisma, animes } = buildEntriesService();
    prisma.calendar.findFirst.mockResolvedValue({
      id: 'cal-1',
      userId: 'user-1',
    });
    animes.getByMalId.mockResolvedValue({ malId: 1, episodes: 12 });
    prisma.anime.findUniqueOrThrow.mockResolvedValue({
      id: 'anime-1',
      malId: 1,
    });
    prisma.calendarEntry.count.mockResolvedValue(0);
    prisma.calendarEntry.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      entries.create('cal-1', 'user-1', { malId: 1, weekday: Weekday.MON }),
    ).rejects.toThrow(ConflictException);
  });

  it('create devolve 404 se o calendário não existe ou não é do usuário', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendar.findFirst.mockResolvedValue(null);

    await expect(
      entries.create('cal-1', 'user-1', { malId: 1, weekday: Weekday.MON }),
    ).rejects.toThrow(NotFoundException);
  });

  it('move devolve 404 se a entrada não é do usuário', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue(null);

    await expect(
      entries.move('entry-1', 'user-1', { weekday: Weekday.TUE, position: 0 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('move entre dias fecha o buraco na origem e abre espaço no destino', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      calendarId: 'cal-1',
      weekday: Weekday.MON,
      position: 2,
    });
    prisma.calendarEntry.findUniqueOrThrow.mockResolvedValue({ id: 'entry-1' });

    await entries.move('entry-1', 'user-1', {
      weekday: Weekday.TUE,
      position: 0,
    });

    expect(prisma.calendarEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          weekday: Weekday.MON,
          position: { gt: 2 },
        }),
        data: { position: { decrement: 1 } },
      }),
    );
    expect(prisma.calendarEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          weekday: Weekday.TUE,
          position: { gte: 0 },
        }),
        data: { position: { increment: 1 } },
      }),
    );
    expect(prisma.calendarEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: { weekday: Weekday.TUE, position: 0 },
    });
  });

  it('updateProgress rejeita currentEpisode acima do total (AC-06)', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      status: EntryStatus.WATCHING,
      totalEpisodes: 12,
    });

    await expect(
      entries.updateProgress('entry-1', 'user-1', { currentEpisode: 13 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateProgress aceita qualquer progresso quando totalEpisodes é null (anime em exibição, ex. One Piece)', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      status: EntryStatus.WATCHING,
      totalEpisodes: null,
    });
    prisma.calendarEntry.update.mockResolvedValue({ id: 'entry-1' });

    await expect(
      entries.updateProgress('entry-1', 'user-1', { currentEpisode: 1088 }),
    ).resolves.toEqual({ id: 'entry-1' });
  });

  it('updateProgress promove PLANNED -> WATCHING ao registrar o 1º episódio', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      status: EntryStatus.PLANNED,
      totalEpisodes: 12,
    });
    prisma.calendarEntry.update.mockResolvedValue({ id: 'entry-1' });

    await entries.updateProgress('entry-1', 'user-1', { currentEpisode: 1 });

    expect(prisma.calendarEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentEpisode: 1, status: EntryStatus.WATCHING },
      }),
    );
  });

  it('updateDetails reposiciona no fim da coluna quando o weekday muda (M6)', async () => {
    const { entries, prisma } = buildEntriesService();
    const beforeMove = {
      id: 'entry-1',
      calendarId: 'cal-1',
      weekday: Weekday.MON,
      position: 2,
      currentEpisode: 1,
      totalEpisodes: 12,
    };
    const afterMove = { ...beforeMove, weekday: Weekday.TUE, position: 3 };
    // updateDetails busca a entrada (1), delega pra move() que busca de novo
    // internamente (2), e por fim rebusca já reposicionada (3) — mesmo
    // findOwned reaproveitado 3x, não é bug de teste duplicado.
    prisma.calendarEntry.findUnique
      .mockResolvedValueOnce(beforeMove)
      .mockResolvedValueOnce(beforeMove)
      .mockResolvedValueOnce(afterMove);
    prisma.calendarEntry.findUniqueOrThrow.mockResolvedValue({ id: 'entry-1' });
    prisma.calendarEntry.count.mockResolvedValue(3); // fim da coluna de TUE

    await entries.updateDetails('entry-1', 'user-1', { weekday: Weekday.TUE });

    expect(prisma.calendarEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: { weekday: Weekday.TUE, position: 3 },
    });
  });

  it('updateDetails rejeita currentEpisode acima do total (mesma regra AC-06)', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      calendarId: 'cal-1',
      weekday: Weekday.MON,
      currentEpisode: 1,
      totalEpisodes: 12,
    });

    await expect(
      entries.updateDetails('entry-1', 'user-1', { currentEpisode: 13 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateDetails atualiza status/total/progresso direto quando o weekday não muda', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      calendarId: 'cal-1',
      weekday: Weekday.MON,
      currentEpisode: 1,
      totalEpisodes: 12,
    });
    prisma.calendarEntry.update.mockResolvedValue({ id: 'entry-1' });

    await entries.updateDetails('entry-1', 'user-1', {
      status: EntryStatus.DROPPED,
    });

    expect(prisma.calendarEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: EntryStatus.DROPPED } }),
    );
  });

  it('updateProgress promove -> COMPLETED ao alcançar o total', async () => {
    const { entries, prisma } = buildEntriesService();
    prisma.calendarEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      status: EntryStatus.WATCHING,
      totalEpisodes: 12,
    });
    prisma.calendarEntry.update.mockResolvedValue({ id: 'entry-1' });

    await entries.updateProgress('entry-1', 'user-1', { currentEpisode: 12 });

    expect(prisma.calendarEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentEpisode: 12, status: EntryStatus.COMPLETED },
      }),
    );
  });
});
