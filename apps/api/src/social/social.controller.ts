import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  type MessageEvent,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import { createCommentSchema, type CreateCommentInput } from '@aniweek/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post('users/:username/follow')
  @ApiOkResponse({ description: 'Passa a seguir um usuário (idempotente).' })
  follow(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.social.follow(user.id, username);
  }

  @Delete('users/:username/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Deixa de seguir um usuário.' })
  unfollow(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.social.unfollow(user.id, username);
  }

  @Get('stats')
  @ApiOkResponse({ description: 'Contagem de seguidores/seguindo.' })
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.social.stats(user.id);
  }

  @Get('discover')
  @ApiOkResponse({ description: 'Sugestões de pessoas pra seguir.' })
  discover(@CurrentUser() user: AuthenticatedUser) {
    return this.social.discover(user.id);
  }

  @Get('following')
  @ApiOkResponse({ description: 'Quem eu sigo.' })
  listFollowing(@CurrentUser() user: AuthenticatedUser) {
    return this.social.listFollowing(user.id);
  }

  @Get('followers')
  @ApiOkResponse({ description: 'Quem me segue.' })
  listFollowers(@CurrentUser() user: AuthenticatedUser) {
    return this.social.listFollowers(user.id);
  }

  // Rota literal 'users/:username' — não colide com 'users/:username/follow'
  // (segmento a mais), mesma regra de rota literal-antes-de-dinâmica do
  // resto do app, só que aqui nem se aplica porque o path inteiro é diferente.
  @Get('users/:username')
  @ApiOkResponse({
    description: 'Perfil público (stats respeitam statsPublic).',
  })
  getPublicProfile(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.social.getPublicProfile(username, user.id);
  }

  @Get('notifications')
  @ApiOkResponse({
    description: 'Feed de notificações (mais recentes primeiro).',
  })
  listNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.social.listNotifications(user.id);
  }

  // SSE atrás do JwtAuthGuard normal (Bearer no header) — de propósito NÃO
  // usa EventSource nativo no front por causa disso: EventSource não deixa
  // setar header Authorization, só manda cookies. A alternativa mais comum
  // (token na query string) vaza o access token em log de acesso/histórico
  // do browser — pior trade-off que só trocar EventSource por fetch +
  // ReadableStream no front (ver features/social/api.ts), que reaproveita a
  // mesma injeção de Bearer do http.ts em vez de abrir uma exceção de
  // segurança só pra essa rota.
  @Sse('notifications/stream')
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.social.stream(user.id);
  }

  @Patch('notifications/read-all')
  @ApiOkResponse({ description: 'Marca todas as notificações como lidas.' })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.social.markAllRead(user.id);
  }

  @Patch('notifications/:id/read')
  @ApiOkResponse({ description: 'Marca uma notificação como lida.' })
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.social.markRead(id, user.id);
  }

  @Get('reactions/mine')
  @ApiOkResponse({
    description: 'IDs dos cards (dentre os informados) que eu já reagi.',
  })
  myReactions(
    @Query('ids') ids: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const entryIds = ids?.split(',').filter(Boolean) ?? [];
    return this.social.myReactions(user.id, entryIds);
  }

  @Get('entries/:entryId/comments')
  @ApiOkResponse({
    description: 'Comentários de um card (mais antigos primeiro).',
  })
  listComments(@Param('entryId') entryId: string) {
    return this.social.listComments(entryId);
  }

  @Post('entries/:entryId/comments')
  @ApiOkResponse({ description: 'Comenta num card de outro usuário.' })
  addComment(
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createCommentSchema)) body: CreateCommentInput,
  ) {
    return this.social.addComment(entryId, user.id, body.body);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Remove um comentário.' })
  removeComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.social.removeComment(id, user.id);
  }

  @Post('entries/:entryId/reactions')
  @ApiOkResponse({ description: 'Alterna (toggle) a reação no card.' })
  toggleReaction(
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.social.toggleReaction(entryId, user.id);
  }
}
