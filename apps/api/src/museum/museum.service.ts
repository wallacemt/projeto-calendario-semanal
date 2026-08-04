import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateWatchedAnimeInput,
  MarkWatchedInput,
  UpdateWatchedAnimeInput,
} from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AnimesService } from '../animes/animes.service';
import { EntryStatus, Prisma } from '../../generated/prisma/client';
import {
  toWatchedAnimeResponse,
  type WatchedAnimeResponse,
} from './types/watched-anime.type';

const MINUTES_PER_EPISODE = 24;
const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export interface MuseumStatsResponse {
  totalWatched: number;
  avgRating: number | null;
  totalHours: number;
  episodesPerWeek: number;
  genreRanking: { name: string; count: number; pct: number }[];
  monthly: { label: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

// Dona de WatchedAnime (§6/M8 — RF-09/RF-10). Museu é registro PERMANENTE
// (sem calendarId — ver comentário no model), então nunca lê/escreve
// CalendarEntry diretamente; quem dispara a criação daqui é EntriesService
// (mark-watched), não o contrário.
@Injectable()
export class MuseumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animes: AnimesService,
  ) {}

  async findAll(userId: string): Promise<WatchedAnimeResponse[]> {
    const [watched, featuredId] = await Promise.all([
      this.prisma.watchedAnime.findMany({
        where: { userId },
        include: { anime: true },
        orderBy: { completedAt: 'desc' },
      }),
      this.resolveFeaturedId(userId),
    ]);
    return watched.map((w) => toWatchedAnimeResponse(w, featuredId));
  }

  // Entrada manual (fora do fluxo de calendário) — reaproveita o upsert do
  // espelho local (mesmo padrão de EntriesService.create) em vez de confiar
  // num título digitado à mão.
  async create(
    userId: string,
    input: CreateWatchedAnimeInput,
  ): Promise<WatchedAnimeResponse> {
    await this.animes.getByMalId(input.malId);
    const anime = await this.prisma.anime.findUniqueOrThrow({
      where: { malId: input.malId },
    });
    return this.createFromAnimeId(userId, anime.id, input);
  }

  // Chamado pelo EntriesService quando uma entrada é marcada como assistida
  // — animeId já é conhecido ali (entry.animeId), sem precisar upsertar via
  // Jikan de novo.
  async createFromAnimeId(
    userId: string,
    animeId: string,
    input: MarkWatchedInput & { completedAt?: Date },
  ): Promise<WatchedAnimeResponse> {
    try {
      const watched = await this.prisma.watchedAnime.create({
        data: {
          userId,
          animeId,
          rating: input.rating,
          comment: input.comment,
          completedAt: input.completedAt,
          watchedSeason: input.watchedSeason,
          watchedYear: input.watchedYear,
        },
        include: { anime: true },
      });
      const featuredId = await this.resolveFeaturedId(userId);
      return toWatchedAnimeResponse(watched, featuredId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este anime já está no museu');
      }
      throw error;
    }
  }

  // Right-click "Editar" (M8.1) — campos opcionais passam direto pro Prisma:
  // `undefined` (não veio no PATCH) é ignorado, `null` explícito limpa o
  // campo (mesmo comportamento de ThemesService.update, só que lá nenhum
  // campo é nullable).
  async update(
    id: string,
    userId: string,
    input: UpdateWatchedAnimeInput,
  ): Promise<WatchedAnimeResponse> {
    const existing = await this.prisma.watchedAnime.findFirst({
      where: { id, userId },
    });
    if (!existing)
      throw new NotFoundException('Registro não encontrado no museu');

    const watched = await this.prisma.watchedAnime.update({
      where: { id },
      data: {
        rating: input.rating,
        comment: input.comment,
        completedAt: input.completedAt,
        watchedSeason: input.watchedSeason,
        watchedYear: input.watchedYear,
      },
      include: { anime: true },
    });
    const featuredId = await this.resolveFeaturedId(userId);
    return toWatchedAnimeResponse(watched, featuredId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.watchedAnime.findFirst({
      where: { id, userId },
    });
    if (!existing)
      throw new NotFoundException('Registro não encontrado no museu');
    await this.prisma.watchedAnime.delete({ where: { id } });
  }

  // Fixar/desfixar (M8.1) — mesmo padrão de ThemesService.setActive:
  // watchedAnimeId null volta pro modo "auto" (resolveFeaturedId cai pro
  // mais recente). onDelete: SetNull no schema já cobre o caso do item
  // fixado ser removido — não precisa de lógica extra aqui pra isso.
  async setFeatured(
    userId: string,
    watchedAnimeId: string | null,
  ): Promise<{ featuredWatchedAnimeId: string | null }> {
    if (watchedAnimeId) {
      const existing = await this.prisma.watchedAnime.findFirst({
        where: { id: watchedAnimeId, userId },
      });
      if (!existing)
        throw new NotFoundException('Registro não encontrado no museu');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { featuredWatchedAnimeId: watchedAnimeId },
    });
    return { featuredWatchedAnimeId: watchedAnimeId };
  }

  // null = modo "auto": cai pro assistido mais recente (completedAt desc) —
  // mesmo "vencedor" que já aparecia como featured.value no MuseumView antes
  // desse pin existir, só que resolvido no backend agora.
  private async resolveFeaturedId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { featuredWatchedAnimeId: true },
    });
    if (user.featuredWatchedAnimeId) return user.featuredWatchedAnimeId;

    const mostRecent = await this.prisma.watchedAnime.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      select: { id: true },
    });
    return mostRecent?.id ?? null;
  }

  // RF-10: totais, média/semana, gêneros mais assistidos — mais alguns
  // extras que o design (M8 Museu.dc.html) pede e dá pra derivar sem
  // rastrear histórico por episódio (que o app não guarda).
  async stats(userId: string): Promise<MuseumStatsResponse> {
    const watched = await this.prisma.watchedAnime.findMany({
      where: { userId },
      include: { anime: true },
    });

    const totalWatched = watched.length;
    const ratings = watched
      .map((w) => w.rating)
      .filter((r): r is number => r != null);
    const avgRating =
      ratings.length === 0
        ? null
        : Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10,
          ) / 10;

    const totalEpisodes = watched.reduce(
      (sum, w) => sum + (w.anime.episodes ?? 0),
      0,
    );
    const totalHours = Math.round((totalEpisodes * MINUTES_PER_EPISODE) / 60);

    // Semanas desde o primeiro registro (mínimo 1 pra não dividir por 0)
    // até agora — aproximação simples de "ritmo médio", não uma métrica de
    // episódios-por-semana rastreada dia a dia.
    const oldestCompletedAt = watched.reduce<Date | null>((oldest, w) => {
      if (!oldest || w.completedAt < oldest) return w.completedAt;
      return oldest;
    }, null);
    const weeksSinceStart = oldestCompletedAt
      ? Math.max(
          1,
          Math.ceil(
            (Date.now() - oldestCompletedAt.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          ),
        )
      : 1;
    const episodesPerWeek =
      totalWatched === 0 ? 0 : Math.round(totalEpisodes / weeksSinceStart);

    const genreCounts = new Map<string, number>();
    for (const w of watched) {
      const genres = Array.isArray(w.anime.genres)
        ? (w.anime.genres as string[])
        : [];
      for (const genre of genres) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }
    const totalGenreTags = [...genreCounts.values()].reduce((a, b) => a + b, 0);
    const genreRanking = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        pct:
          totalGenreTags === 0
            ? 0
            : Math.round((count / totalGenreTags) * 1000) / 10,
      }));

    // Últimos 12 meses (incluindo o atual), ordem cronológica.
    const now = new Date();
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const count = watched.filter(
        (w) =>
          w.completedAt.getFullYear() === d.getFullYear() &&
          w.completedAt.getMonth() === d.getMonth(),
      ).length;
      return { label: MONTH_LABELS[d.getMonth()], count };
    });

    // Distribuição por status do board — exclui COMPLETED (já contado no
    // museu, mostrar de novo aqui duplicaria o "assistido" visualmente).
    const statusGroups = await this.prisma.calendarEntry.groupBy({
      by: ['status'],
      where: {
        calendar: { userId },
        status: { not: EntryStatus.COMPLETED },
      },
      _count: true,
    });
    const statusBreakdown = statusGroups.map((g) => ({
      status: g.status,
      count: g._count,
    }));

    return {
      totalWatched,
      avgRating,
      totalHours,
      episodesPerWeek,
      genreRanking,
      monthly,
      statusBreakdown,
    };
  }
}
