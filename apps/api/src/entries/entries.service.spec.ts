import { ConflictException, NotFoundException } from '@nestjs/common';
import { Weekday } from '@aniweek/shared';
import { EntriesService } from './entries.service';
import { Prisma } from '../../generated/prisma/client';

// Cobre as regras não-triviais do módulo: posição no fim da coluna do dia
// (nota técnica da issue M4.2), o mapeamento P2002 -> 409 (constraint
// @@unique([calendarId, animeId])) e a checagem de dono do calendário.

function buildEntriesService() {
  const prisma = {
    calendar: { findFirst: jest.fn() },
    anime: { findUniqueOrThrow: jest.fn() },
    calendarEntry: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
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
});
