import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  moveEntrySchema,
  updateProgressSchema,
  type MoveEntryInput,
  type UpdateProgressInput,
} from '@aniweek/shared';
import { EntriesService } from './entries.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Remove uma entrada do calendário.' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.entries.remove(id, user.id);
  }

  @Patch(':id/move')
  @ApiOkResponse({ description: 'Reordena a entrada (drag-and-drop).' })
  move(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(moveEntrySchema)) body: MoveEntryInput,
  ) {
    return this.entries.move(id, user.id, body);
  }

  @Patch(':id/progress')
  @ApiOkResponse({ description: 'Atualiza o episódio atual assistido.' })
  updateProgress(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProgressSchema))
    body: UpdateProgressInput,
  ) {
    return this.entries.updateProgress(id, user.id, body);
  }
}
