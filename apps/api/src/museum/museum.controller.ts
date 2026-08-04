import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  createWatchedAnimeSchema,
  setFeaturedWatchedSchema,
  updateWatchedAnimeSchema,
  type CreateWatchedAnimeInput,
  type SetFeaturedWatchedInput,
  type UpdateWatchedAnimeInput,
} from '@aniweek/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { MuseumService } from './museum.service';

@Controller('museum')
export class MuseumController {
  constructor(private readonly museum: MuseumService) {}

  @Get()
  @ApiOkResponse({ description: 'Galeria de animes concluídos do usuário.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.museum.findAll(user.id);
  }

  @Get('stats')
  @ApiOkResponse({ description: 'Métricas agregadas (RF-10).' })
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.museum.stats(user.id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Adiciona um anime direto ao museu.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createWatchedAnimeSchema))
    body: CreateWatchedAnimeInput,
  ) {
    return this.museum.create(user.id, body);
  }

  // Rota literal — precisa vir antes de ':id' (mesma regra de 'stats' acima
  // e do ThemesController/AnimesController): senão o Nest tentaria casar
  // "featured" com o parâmetro :id do PATCH abaixo.
  @Patch('featured')
  @ApiOkResponse({
    description: 'Fixa/desfixa o item em destaque (null = modo auto).',
  })
  setFeatured(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(setFeaturedWatchedSchema))
    body: SetFeaturedWatchedInput,
  ) {
    return this.museum.setFeatured(user.id, body.watchedAnimeId);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Edita nota/comentário/data de um registro.' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateWatchedAnimeSchema))
    body: UpdateWatchedAnimeInput,
  ) {
    return this.museum.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Remove um registro do museu.' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.museum.remove(id, user.id);
  }
}
