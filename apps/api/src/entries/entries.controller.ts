import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  markWatchedSchema,
  moveEntrySchema,
  updateEntrySchema,
  updateProgressSchema,
  type MarkWatchedInput,
  type MoveEntryInput,
  type UpdateEntryInput,
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

  @Post(':id/complete')
  @ApiOkResponse({
    description: 'Marca como assistido — cria registro no museu (M8/RF-09).',
  })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(markWatchedSchema)) body: MarkWatchedInput,
  ) {
    return this.entries.complete(id, user.id, body);
  }

  // M6 (fora do blueprint): PATCH único do modal de editar card.
  @Patch(':id')
  @ApiOkResponse({
    description: 'Edita weekday/progresso/total/status de uma entrada (M6).',
  })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateEntrySchema)) body: UpdateEntryInput,
  ) {
    return this.entries.updateDetails(id, user.id, body);
  }
}
