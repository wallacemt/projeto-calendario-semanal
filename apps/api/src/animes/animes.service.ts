import { Injectable, Logger } from '@nestjs/common';
import type {
  AnimeDto,
  AnimeFullDto,
  PaginatedAnimeDto,
  SearchAnimesQuery,
} from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { JikanService } from '../jikan/jikan.service';
import type { Anime } from '../../generated/prisma/client';

@Injectable()
export class AnimesService {
  private readonly logger = new Logger(AnimesService.name);

  constructor(
    private readonly jikan: JikanService,
    private readonly prisma: PrismaService,
  ) {}

  search(input: SearchAnimesQuery): Promise<PaginatedAnimeDto> {
    return this.jikan.searchAnime(input);
  }

  getByCurrentSeason(page: number): Promise<PaginatedAnimeDto> {
    return this.jikan.getByCurrentSeson(page);
  }

  // Página de detalhe completo (M3): só leitura, não passa pelo espelho
  // local — o Anime (Prisma) guarda só os campos usados no calendário, não
  // faz sentido inflar o schema com trailer/rank/studios por causa de uma
  // página de detalhe.
  getFullByMalId(malId: number): Promise<AnimeFullDto> {
    return this.jikan.getAnimeFullById(malId);
  }

  // Contrato do blueprint (§8): detalhe faz upsert em Anime (espelho local).
  // Se o Jikan estiver fora do ar, degrada servindo o que já está em cache
  // local em vez de derrubar a rota (§12 — "dependências externas e falhas").
  async getByMalId(malId: number): Promise<AnimeDto> {
    try {
      const dto = await this.jikan.getAnimeById(malId);
      await this.prisma.anime.upsert({
        where: { malId },
        create: toAnimeRow(dto),
        update: toAnimeRow(dto),
      });
      return dto;
    } catch (error) {
      const fallback = await this.prisma.anime.findUnique({ where: { malId } });
      if (!fallback) throw error;
      this.logger.warn(
        `Jikan indisponível — servindo Anime#${malId} do cache local`,
      );
      return toAnimeDto(fallback);
    }
  }
}

function toAnimeRow(dto: AnimeDto) {
  return {
    malId: dto.malId,
    title: dto.title,
    imageUrl: dto.imageUrl,
    synopsis: dto.synopsis,
    episodes: dto.episodes,
    genres: dto.genres,
    malUrl: dto.malUrl,
  };
}

function toAnimeDto(row: Anime): AnimeDto {
  return {
    malId: row.malId,
    title: row.title,
    imageUrl: row.imageUrl,
    synopsis: row.synopsis,
    episodes: row.episodes,
    genres: Array.isArray(row.genres) ? (row.genres as string[]) : [],
    malUrl: row.malUrl,
    // não persistidos no espelho local — indisponíveis no fallback
    type: null,
    year: null,
    score: null,
    status: null,
  };
}
