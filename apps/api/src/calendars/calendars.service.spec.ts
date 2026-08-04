import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntryStatus, Season } from '@aniweek/shared';
import { CalendarsService } from './calendars.service';
import { Prisma } from '../../generated/prisma/client';

// Cobre as duas regras não-triviais do módulo: AC-03 (409 num 2º calendário
// na mesma temporada) e "calendário de outro usuário deve parecer
// inexistente" (404, não 403 — findOne escopa por userId na própria query).
// M6 soma o import-previous (AC-04): traz status != COMPLETED da temporada
// anterior, preserva/reseta progresso, idempotente via P2002.

function buildCalendarsService() {
  const prisma = {
    calendar: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    calendarEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  };
  const entries = { create: jest.fn() };
  const calendars = new CalendarsService(prisma as never, entries as never);
  return { calendars, prisma, entries };
}

describe('CalendarsService', () => {
  it('create rejeita um 2º calendário na mesma temporada (AC-03)', async () => {
    const { calendars, prisma } = buildCalendarsService();
    prisma.calendar.findUnique.mockResolvedValue({ id: 'cal-1' });

    await expect(
      calendars.create('user-1', { season: Season.SUMMER, year: 2026 }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.calendar.create).not.toHaveBeenCalled();
  });

  it('findOne devolve 404 (não vaza existência) quando o calendário é de outro usuário', async () => {
    const { calendars, prisma } = buildCalendarsService();
    prisma.calendar.findFirst.mockResolvedValue(null);

    await expect(calendars.findOne('cal-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.calendar.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cal-1', userId: 'user-1' } }),
    );
  });

  it('importPrevious é no-op (AC-04) quando não existe calendário na temporada anterior', async () => {
    const { calendars, prisma } = buildCalendarsService();
    prisma.calendar.findFirst.mockResolvedValue({
      id: 'cal-2',
      userId: 'user-1',
      season: Season.SUMMER,
      year: 2026,
    });
    prisma.calendar.findUnique.mockResolvedValue(null);

    const result = await calendars.importPrevious('cal-2', 'user-1', {});

    expect(result).toEqual([]);
    expect(prisma.calendarEntry.findMany).not.toHaveBeenCalled();
  });

  it('importPrevious preserva currentEpisode por default (AC-04)', async () => {
    const { calendars, prisma } = buildCalendarsService();
    prisma.calendar.findFirst.mockResolvedValue({
      id: 'cal-2',
      userId: 'user-1',
      season: Season.SUMMER,
      year: 2026,
    });
    prisma.calendar.findUnique.mockResolvedValue({ id: 'cal-1' });
    prisma.calendarEntry.findMany.mockResolvedValue([
      {
        id: 'se-1',
        animeId: 'anime-1',
        weekday: 'MON',
        currentEpisode: 5,
        totalEpisodes: 12,
        status: 'WATCHING',
      },
    ]);
    prisma.calendarEntry.count.mockResolvedValue(0);
    prisma.calendarEntry.create.mockResolvedValue({ id: 'new-1' });

    await calendars.importPrevious('cal-2', 'user-1', {});

    expect(prisma.calendarEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          calendarId: 'cal-2',
          animeId: 'anime-1',
          currentEpisode: 5,
          status: EntryStatus.WATCHING,
          position: 0,
        }),
      }),
    );
  });

  it('importPrevious zera currentEpisode quando resetProgress:true', async () => {
    const { calendars, prisma } = buildCalendarsService();
    prisma.calendar.findFirst.mockResolvedValue({
      id: 'cal-2',
      userId: 'user-1',
      season: Season.SUMMER,
      year: 2026,
    });
    prisma.calendar.findUnique.mockResolvedValue({ id: 'cal-1' });
    prisma.calendarEntry.findMany.mockResolvedValue([
      {
        id: 'se-1',
        animeId: 'anime-1',
        weekday: 'MON',
        currentEpisode: 5,
        totalEpisodes: 12,
        status: 'WATCHING',
      },
    ]);
    prisma.calendarEntry.count.mockResolvedValue(0);
    prisma.calendarEntry.create.mockResolvedValue({ id: 'new-1' });

    await calendars.importPrevious('cal-2', 'user-1', { resetProgress: true });

    expect(prisma.calendarEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentEpisode: 0 }),
      }),
    );
  });

  it('importPrevious pula (idempotência) uma entrada já importada — P2002', async () => {
    const { calendars, prisma } = buildCalendarsService();
    prisma.calendar.findFirst.mockResolvedValue({
      id: 'cal-2',
      userId: 'user-1',
      season: Season.SUMMER,
      year: 2026,
    });
    prisma.calendar.findUnique.mockResolvedValue({ id: 'cal-1' });
    prisma.calendarEntry.findMany.mockResolvedValue([
      {
        id: 'se-1',
        animeId: 'anime-1',
        weekday: 'MON',
        currentEpisode: 1,
        totalEpisodes: 12,
        status: 'WATCHING',
      },
    ]);
    prisma.calendarEntry.count.mockResolvedValue(0);
    prisma.calendarEntry.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const result = await calendars.importPrevious('cal-2', 'user-1', {});

    expect(result).toEqual([]);
  });
});
