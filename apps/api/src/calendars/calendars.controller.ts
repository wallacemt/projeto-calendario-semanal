import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { getCurrentSeason, type CurrentSeason } from './current-season.util';

@Controller('calendars')
export class CalendarsController {
  // Público (§ tela de auth) — precisa responder antes do login.
  @Public()
  @Get('current-season')
  @ApiOkResponse({
    description: 'Estação (season) e ano correntes do calendário de animes.',
  })
  currentSeason(): CurrentSeason {
    return getCurrentSeason();
  }
}
