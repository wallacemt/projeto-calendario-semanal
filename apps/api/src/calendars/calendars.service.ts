import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AddEntryInput, CreateCalendarInput } from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EntriesService } from '../entries/entries.service';
import { getCurrentSeason } from './current-season.util';
import {
  toCalendarBoard,
  type CalendarBoardResponse,
} from './types/calendar-board.type';
import type { Calendar } from '../../generated/prisma/client';

const BOARD_INCLUDE = { entries: { include: { anime: true } } } as const;

// Dona de Calendar (§6 do blueprint) — cria/lista por estação, detecta a
// estação atual. NÃO sabe posicionar card na coluna do dia: isso é delegado
// ao EntriesService (import-previous, no M6, seguirá a mesma regra).
@Injectable()
export class CalendarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entries: EntriesService,
  ) {}

  async create(userId: string, input: CreateCalendarInput): Promise<Calendar> {
    const existing = await this.prisma.calendar.findUnique({
      where: {
        userId_season_year: { userId, season: input.season, year: input.year },
      },
    });
    // AC-03: 2º calendário na mesma temporada -> 409.
    if (existing)
      throw new ConflictException(
        'Já existe um calendário para essa temporada',
      );

    return this.prisma.calendar.create({
      data: { userId, season: input.season, year: input.year },
    });
  }

  findAll(userId: string): Promise<Calendar[]> {
    return this.prisma.calendar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCurrent(userId: string): Promise<CalendarBoardResponse> {
    const { season, year } = getCurrentSeason();
    const calendar = await this.prisma.calendar.findUnique({
      where: { userId_season_year: { userId, season, year } },
      include: BOARD_INCLUDE,
    });
    if (!calendar)
      throw new NotFoundException('Nenhum calendário para a estação atual');
    return toCalendarBoard(calendar);
  }

  async findOne(id: string, userId: string): Promise<CalendarBoardResponse> {
    // findFirst (não findUnique) para escopar por userId na mesma query — um
    // calendário de outro usuário deve parecer inexistente (404), não 403.
    const calendar = await this.prisma.calendar.findFirst({
      where: { id, userId },
      include: BOARD_INCLUDE,
    });
    if (!calendar) throw new NotFoundException('Calendário não encontrado');
    return toCalendarBoard(calendar);
  }

  addEntry(calendarId: string, userId: string, input: AddEntryInput) {
    return this.entries.create(calendarId, userId, input);
  }
}
