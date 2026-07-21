import { ConflictException, NotFoundException } from '@nestjs/common';
import { Season } from '@aniweek/shared';
import { CalendarsService } from './calendars.service';

// Cobre as duas regras não-triviais do módulo: AC-03 (409 num 2º calendário
// na mesma temporada) e "calendário de outro usuário deve parecer
// inexistente" (404, não 403 — findOne escopa por userId na própria query).

function buildCalendarsService() {
  const prisma = {
    calendar: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
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
});
