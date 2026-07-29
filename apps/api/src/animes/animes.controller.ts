import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import {
  searchAnimesQuerySchema,
  seasonNowQuerySchema,
  updateAnimeSchema,
  type SearchAnimesQuery,
  type SeasonNowQuery,
  type UpdateAnimeInput,
} from '@aniweek/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AnimesService } from './animes.service';

@Controller('animes')
export class AnimesController {
  constructor(private readonly animes: AnimesService) {}

  @Get('search')
  @ApiOkResponse({ description: 'Busca animes na API externa (cache 1h)' })
  search(
    @Query(new ZodValidationPipe(searchAnimesQuerySchema))
    query: SearchAnimesQuery,
  ) {
    return this.animes.search(query);
  }

  // Rotas literais (search, season/now) precisam vir antes de ':malId' —
  // não porque colidem (path-to-regexp não confunde 1 segmento com 2), mas
  // pra deixar explícito pro próximo dev que mexer aqui que ordem importa
  // nesse tipo de rota e evitar um bug real se ':malId' virar um catch-all.
  @Get('season/now')
  @ApiOkResponse({
    description: 'Animes da temporada vigente (paginado, cache 1h).',
  })
  getByCurrentSeason(
    @Query(new ZodValidationPipe(seasonNowQuerySchema)) query: SeasonNowQuery,
  ) {
    return this.animes.getByCurrentSeason(query);
  }

  @Get(':malId')
  @ApiOkResponse({
    description: 'Detalhe de um anime (cache 24h, faz upsert local)',
  })
  getByMalId(@Param('malId', ParseIntPipe) malId: number) {
    return this.animes.getByMalId(malId);
  }

  @Get(':malId/full')
  @ApiOkResponse({
    description:
      'Detalhe completo do anime (trailer, estúdios, rank etc, cache 24h). Não faz upsert local.',
  })
  getFullByMalId(@Param('malId', ParseIntPipe) malId: number) {
    return this.animes.getFullByMalId(malId);
  }

  // id local (Anime.id via CalendarEntry.anime), não malId — edição mexe no
  // espelho, não na identidade externa (M6, fora do blueprint).
  @Patch(':id')
  @ApiOkResponse({ description: 'Edita o espelho local do anime (M6).' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAnimeSchema)) body: UpdateAnimeInput,
  ) {
    return this.animes.update(id, body);
  }
}
