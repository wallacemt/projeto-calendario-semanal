import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  AnimeDto,
  AnimeFullDto,
  PaginatedAnimeDto,
  SearchAnimesQuery,
  SeasonNowQuery,
  UpdateAnimeInput,
} from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AnimeApiService } from '../anime-api/anime-api.service';
import type { Anime } from '../../generated/prisma/client';

@Injectable()
export class AnimesService {
  private readonly logger = new Logger(AnimesService.name);

  constructor(
    private readonly animeApi: AnimeApiService,
    private readonly prisma: PrismaService,
  ) {}

  search(input: SearchAnimesQuery): Promise<PaginatedAnimeDto> {
    return this.animeApi.searchAnime(input);
  }

  getByCurrentSeason(query: SeasonNowQuery): Promise<PaginatedAnimeDto> {
    return this.animeApi.getByCurrentSeason(query);
  }

  // Página de detalhe completo (M3): só leitura, não passa pelo espelho
  // local — o Anime (Prisma) guarda só os campos usados no calendário, não
  // faz sentido inflar o schema com trailer/rank/studios por causa de uma
  // página de detalhe.
  getFullByMalId(malId: number): Promise<AnimeFullDto> {
    return this.animeApi.getAnimeFullById(malId);
  }

  // Contrato do blueprint (§8): detalhe faz upsert em Anime (espelho local).
  // Se a API externa estiver fora do ar, degrada servindo o que já está em
  // cache local em vez de derrubar a rota (§12 — "dependências externas e
  // falhas").
  async getByMalId(malId: number): Promise<AnimeDto> {
    try {
      const dto = await this.animeApi.getAnimeById(malId);
      // M6: se o usuário editou esse anime manualmente (PATCH /animes/:id),
      // o upsert do Jikan não pisa em cima — só cria a linha se ela ainda
      // não existir localmente. Sem esse guard, abrir o detalhe de novo
      // (qualquer tela que chame esse método) sobrescreveria a edição.
      const existing = await this.prisma.anime.findUnique({ where: { malId } });
      if (existing?.manuallyEdited) return dto;
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
        `API de animes indisponível — servindo Anime#${malId} do cache local`,
      );
      return toAnimeDto(fallback);
    }
  }

  // M6 (fora do blueprint): edição manual do espelho local — malId de fora
  // (não muda a identidade externa). manuallyEdited:true é o que faz
  // getByMalId parar de sobrescrever essa linha no próximo upsert do Jikan.
  async update(id: string, input: UpdateAnimeInput): Promise<Anime> {
    const existing = await this.prisma.anime.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Anime não encontrado');

    return this.prisma.anime.update({
      where: { id },
      data: { ...input, manuallyEdited: true },
    });
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
