import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AddEntryInput,
  MoveEntryInput,
  UpdateProgressInput,
} from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AnimesService } from '../animes/animes.service';
import { EntryStatus, Prisma } from '../../generated/prisma/client';

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
    await this.findOwned(entryId, userId);
    await this.prisma.calendarEntry.delete({
      where: { id: entryId, calendar: { userId } },
    });
  }

  // M5 (RF-05/AC-05): reordena o board. position é o índice final na coluna
  // de destino — os vizinhos (na origem e no destino) são deslocados em
  // transação pra não sobrar gap nem duas entradas na mesma posição.
  async move(entryId: string, userId: string, input: MoveEntryInput) {
    const entry = await this.findOwned(entryId, userId);
    const { weekday: toWeekday, position: toPosition } = input;

    await this.prisma.$transaction(async (tx) => {
      // weekday do Prisma e do @aniweek/shared são enums TS distintos (mesmos
      // valores, tipos nominais diferentes) — compara pela string.
      if ((entry.weekday as string) === toWeekday) {
        if (toPosition === entry.position) return;
        if (toPosition < entry.position) {
          await tx.calendarEntry.updateMany({
            where: {
              calendarId: entry.calendarId,
              weekday: toWeekday,
              position: { gte: toPosition, lt: entry.position },
            },
            data: { position: { increment: 1 } },
          });
        } else {
          await tx.calendarEntry.updateMany({
            where: {
              calendarId: entry.calendarId,
              weekday: toWeekday,
              position: { gt: entry.position, lte: toPosition },
            },
            data: { position: { decrement: 1 } },
          });
        }
      } else {
        // fecha o buraco na coluna de origem
        await tx.calendarEntry.updateMany({
          where: {
            calendarId: entry.calendarId,
            weekday: entry.weekday,
            position: { gt: entry.position },
          },
          data: { position: { decrement: 1 } },
        });
        // abre espaço na coluna de destino
        await tx.calendarEntry.updateMany({
          where: {
            calendarId: entry.calendarId,
            weekday: toWeekday,
            position: { gte: toPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.calendarEntry.update({
        where: { id: entryId },
        data: { weekday: toWeekday, position: toPosition },
      });
    });

    return this.prisma.calendarEntry.findUniqueOrThrow({
      where: { id: entryId },
      include: { anime: true },
    });
  }

  // M5 (AC-06): valida currentEpisode <= totalEpisodes e promove o status
  // automaticamente (PLANNED -> WATCHING ao começar, -> COMPLETED ao chegar
  // no total) — sem exigir um passo manual de "mudar status" à parte.
  async updateProgress(
    entryId: string,
    userId: string,
    input: UpdateProgressInput,
  ) {
    const entry = await this.findOwned(entryId, userId);

    if (input.currentEpisode > entry.totalEpisodes!) {
      throw new BadRequestException(
        'Episódio atual não pode passar do total de episódios',
      );
    }

    const data: Prisma.CalendarEntryUpdateInput = {
      currentEpisode: input.currentEpisode,
    };
    if (entry.status === EntryStatus.PLANNED && input.currentEpisode > 0) {
      data.status = EntryStatus.WATCHING;
    }
    if (
      entry.totalEpisodes != null &&
      input.currentEpisode >= entry.totalEpisodes
    ) {
      data.status = EntryStatus.COMPLETED;
    }

    return this.prisma.calendarEntry.update({
      where: { id: entryId },
      data,
      include: { anime: true },
    });
  }

  // Dono do calendário (mesma checagem 404-não-403 do create) — reaproveitada
  // por remove/move/updateProgress em vez de repetir o findUnique 3x.
  private async findOwned(entryId: string, userId: string) {
    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId, calendar: { userId } },
    });
    if (!entry) throw new NotFoundException('Entrada não encontrada');
    return entry;
  }
}
