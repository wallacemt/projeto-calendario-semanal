import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AddEntryInput,
  CreateCalendarInput,
  ImportPreviousInput,
} from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EntriesService } from '../entries/entries.service';
import { getCurrentSeason, getPreviousSeason } from './current-season.util';
import {
  toCalendarBoard,
  type CalendarBoardResponse,
} from './types/calendar-board.type';
import {
  EntryStatus,
  Prisma,
  type Anime,
  type Calendar,
  type CalendarEntry,
} from '../../generated/prisma/client';

// _count de comments/reactions (M10) pro dono ver, direto no board, quem
// interagiu com o próprio progresso — sem isso ele só saberia pelo texto
// truncado da notificação, sem nem contagem.
const BOARD_INCLUDE = {
  entries: {
    include: {
      anime: true,
      _count: { select: { comments: true, reactions: true } },
    },
  },
} as const;

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

  // §7/AC-04 do blueprint: traz em massa os animes "em andamento" (status !=
  // COMPLETED) da temporada imediatamente anterior, preservando weekday e
  // (por default) currentEpisode. Idempotente via @@unique([calendarId,
  // animeId]) — reimportar não duplica, só pula quem já está no alvo.
  async importPrevious(
    calendarId: string,
    userId: string,
    input: ImportPreviousInput,
  ) {
    const target = await this.prisma.calendar.findFirst({
      where: { id: calendarId, userId },
    });
    if (!target) throw new NotFoundException('Calendário não encontrado');

    // weekday do Prisma e do @aniweek/shared são enums TS distintos (mesmos
    // valores, tipos nominais diferentes — mesmo caso do comparador em
    // EntriesService.move). getPreviousSeason só lê os valores, então o
    // cast é seguro.
    const { season, year } = getPreviousSeason(
      target as unknown as Parameters<typeof getPreviousSeason>[0],
    );
    const previous = await this.prisma.calendar.findUnique({
      where: { userId_season_year: { userId, season, year } },
    });
    if (!previous) return []; // nada na temporada anterior — no-op

    const sourceEntries = await this.prisma.calendarEntry.findMany({
      where: {
        calendarId: previous.id,
        status: { not: EntryStatus.COMPLETED },
        ...(input.entryIds ? { id: { in: input.entryIds } } : {}),
      },
    });

    const nextPositionByWeekday = new Map<string, number>();
    const imported: (CalendarEntry & { anime: Anime })[] = [];
    for (const entry of sourceEntries) {
      const weekdayKey = entry.weekday as string;
      if (!nextPositionByWeekday.has(weekdayKey)) {
        const count = await this.prisma.calendarEntry.count({
          where: { calendarId: target.id, weekday: entry.weekday },
        });
        nextPositionByWeekday.set(weekdayKey, count);
      }
      const position = nextPositionByWeekday.get(weekdayKey)!;

      try {
        const created = await this.prisma.calendarEntry.create({
          data: {
            calendarId: target.id,
            animeId: entry.animeId,
            weekday: entry.weekday,
            position,
            currentEpisode: input.resetProgress ? 0 : entry.currentEpisode,
            totalEpisodes: entry.totalEpisodes,
            status: EntryStatus.WATCHING,
          },
          include: { anime: true },
        });
        imported.push(created);
        nextPositionByWeekday.set(weekdayKey, position + 1);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue; // já importado antes — idempotência (AC-04)
        }
        throw error;
      }
    }

    return imported;
  }
}
