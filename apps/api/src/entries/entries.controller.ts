import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiNoContentResponse } from '@nestjs/swagger';
import { EntriesService } from './entries.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Remove uma entrada do calendário.' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.entries.remove(id, user.id);
  }
}
