import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  addEntrySchema,
  createCalendarSchema,
  type AddEntryInput,
  type CreateCalendarInput,
} from '@aniweek/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CalendarsService } from './calendars.service';
import { getCurrentSeason, type CurrentSeason } from './current-season.util';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendars: CalendarsService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Cria um calendário para (season, year). 409 se já existir.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createCalendarSchema))
    body: CreateCalendarInput,
  ) {
    return this.calendars.create(user.id, body);
  }

  @Get()
  @ApiOkResponse({ description: 'Todas as estações (calendários) do usuário.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.calendars.findAll(user.id);
  }

  // Público (§ tela de auth) — precisa responder antes do login. Rota
  // literal: precisa vir antes de ':id' (ver comentário no AnimesController).
  @Public()
  @Get('current-season')
  @ApiOkResponse({
    description: 'Estação (season) e ano correntes do calendário de animes.',
  })
  currentSeason(): CurrentSeason {
    return getCurrentSeason();
  }

  @Get('current')
  @ApiOkResponse({
    description: 'Board da estação atual, ou 404 se não existir.',
  })
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.calendars.findCurrent(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Calendário + entries agrupadas por weekday.' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.calendars.findOne(id, user.id);
  }

  @Post(':id/entries')
  @ApiCreatedResponse({
    description: 'Adiciona um anime a um dia do board (upsert via API de animes).',
  })
  addEntry(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(addEntrySchema)) body: AddEntryInput,
  ) {
    return this.calendars.addEntry(id, user.id, body);
  }
}
