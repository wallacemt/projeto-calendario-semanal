import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import { inviteToShareSchema, type InviteToShareInput } from '@aniweek/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SharingService } from './sharing.service';

// Convite dispara lookup por username + criação de registro — mesmo teto
// aplicado a rotas sensíveis de auth (ver BRUTE_FORCE_THROTTLE), só menos
// severo: não é força bruta de senha, mas ainda vale limitar enumeração de
// usernames existentes via 404 vs 409.
const INVITE_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('sharing')
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  @Get()
  @ApiOkResponse({
    description: 'Status do link de compartilhamento + pessoas com acesso.',
  })
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.sharing.getStatus(user.id);
  }

  @Post('toggle')
  @ApiOkResponse({ description: 'Ativa/desativa o link view-only.' })
  toggle(@CurrentUser() user: AuthenticatedUser) {
    return this.sharing.toggle(user.id);
  }

  @Throttle(INVITE_THROTTLE)
  @Post('invite')
  @ApiOkResponse({
    description: 'Convida um usuário (por @username) para ver seu calendário.',
  })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(inviteToShareSchema)) body: InviteToShareInput,
  ) {
    return this.sharing.invite(user.id, body.username);
  }

  @Delete('grants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Revoga o acesso de um convidado.' })
  revoke(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.sharing.revokeGrant(id, user.id);
  }

  // Público (consumo do link por quem recebeu) — sem @CurrentUser, sem
  // exigir sessão. Rota literal 'public/:token', não colide com nenhuma
  // outra rota literal deste controller.
  @Public()
  @Get('public/:token')
  @ApiOkResponse({
    description: 'Board view-only de quem gerou o link (público).',
  })
  getPublic(@Param('token') token: string) {
    return this.sharing.getPublicBoard(token);
  }
}
