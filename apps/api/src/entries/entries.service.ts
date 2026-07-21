import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AddEntryInput } from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AnimesService } from '../animes/animes.service';
import { Prisma } from '../../generated/prisma/client';

// Dona de CalendarEntry (§6 do blueprint) — Calendars delega aqui a criação
// de entrada porque quem sabe posicionar um card na coluna do dia é este
// módulo, não o dono do Calendar.
@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animes: AnimesService,
  ) {}

  async create(calendarId: string, userId: string, input: AddEntryInput) {
    // 404 (não 403) se o calendário não existir OU não for do usuário —
    // clássico de entrevista: não vazar pra quem não é dono se o recurso
    // existe (evita enumeração de IDs de outros usuários).
    const calendar = await this.prisma.calendar.findFirst({
      where: { id: calendarId, userId },
    });
    if (!calendar) throw new NotFoundException('Calendário não encontrado');

    // Reaproveita o upsert do espelho local (M3/ADR-06) em vez de duplicar a
    // lógica de "buscar no Jikan e cachear" aqui.
    const animeDto = await this.animes.getByMalId(input.malId);
    const anime = await this.prisma.anime.findUniqueOrThrow({
      where: { malId: input.malId },
    });

    // position = fim da coluna do dia (nota técnica da issue M4.2).
    const position = await this.prisma.calendarEntry.count({
      where: { calendarId, weekday: input.weekday },
    });

    try {
      return await this.prisma.calendarEntry.create({
        data: {
          calendarId,
          animeId: anime.id,
          weekday: input.weekday,
          position,
          totalEpisodes: animeDto.episodes,
        },
        include: { anime: true },
      });
    } catch (error) {
      // @@unique([calendarId, animeId]) — P2002 é o código do Prisma para
      // violação de constraint única.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este anime já está no calendário');
      }
      throw error;
    }
  }

  async remove(entryId: string, userId: string): Promise<void> {
    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId, calendar: { userId } },
    });
    if (!entry) throw new NotFoundException('Entrada não encontrada');
    await this.prisma.calendarEntry.delete({
      where: { id: entryId, calendar: { userId } },
    });
  }
}
