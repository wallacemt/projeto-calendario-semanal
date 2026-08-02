import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { getCurrentSeason } from '../calendars/current-season.util';
import {
  toCalendarBoard,
  type CalendarBoardResponse,
} from '../calendars/types/calendar-board.type';
import {
  toPublicOwner,
  toShareStatusResponse,
  type PublicOwnerResponse,
  type ShareStatusResponse,
  type ShareWithGrants,
} from './types/share-status.type';

export interface PublicCalendarBoardResponse extends CalendarBoardResponse {
  owner: PublicOwnerResponse;
}

const GRANTS_INCLUDE = {
  grants: { include: { user: true }, orderBy: { createdAt: 'desc' } },
} as const;

// Dona de CalendarShare/ShareGrant (M9 — RF-11). O link sempre aponta pra
// estação ATUAL do dono (getCurrentSeason) — ver comentário no model
// CalendarShare sobre por que é 1:1 com User em vez de Calendar.
@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string): Promise<ShareStatusResponse> {
    const share = await this.ensureShare(userId);
    return toShareStatusResponse(share);
  }

  async toggle(userId: string): Promise<ShareStatusResponse> {
    const share = await this.ensureShare(userId);
    const updated = await this.prisma.calendarShare.update({
      where: { id: share.id },
      data: { active: !share.active },
      include: GRANTS_INCLUDE,
    });
    return toShareStatusResponse(updated);
  }

  // Convite nominal (M9): sempre view-only, sem opção de permissão — ver
  // comentário no model CalendarShare sobre o porquê.
  async invite(userId: string, username: string): Promise<ShareStatusResponse> {
    const invitee = await this.prisma.user.findUnique({ where: { username } });
    if (!invitee) throw new NotFoundException('Usuário não encontrado');
    if (invitee.id === userId) {
      throw new BadRequestException('Você não pode convidar a si mesmo');
    }

    const share = await this.ensureShare(userId);
    try {
      await this.prisma.shareGrant.create({
        data: { shareId: share.id, userId: invitee.id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Esse usuário já tem acesso ao seu calendário',
        );
      }
      throw error;
    }

    return this.getStatus(userId);
  }

  async revokeGrant(grantId: string, userId: string): Promise<void> {
    const grant = await this.prisma.shareGrant.findFirst({
      where: { id: grantId, share: { userId } },
    });
    if (!grant) throw new NotFoundException('Convite não encontrado');
    await this.prisma.shareGrant.delete({ where: { id: grantId } });
  }

  // Consumo público do link (view-only, sem JwtAuthGuard — ver
  // SharingController). token inválido e link desativado retornam o mesmo
  // 404 — não dá pra distinguir "não existe" de "foi desativado" de fora.
  async getPublicBoard(token: string): Promise<PublicCalendarBoardResponse> {
    const share = await this.prisma.calendarShare.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!share || !share.active) {
      throw new NotFoundException('Link inválido ou desativado');
    }

    const { season, year } = getCurrentSeason();
    const calendar = await this.prisma.calendar.findUnique({
      where: { userId_season_year: { userId: share.userId, season, year } },
      include: {
        entries: {
          include: {
            anime: true,
            _count: { select: { comments: true, reactions: true } },
          },
        },
      },
    });
    if (!calendar) {
      throw new NotFoundException('Nenhum calendário para a estação atual');
    }
    return { ...toCalendarBoard(calendar), owner: toPublicOwner(share.user) };
  }

  // Upsert implícito: a primeira leitura/ação de compartilhamento já cria o
  // registro (ativo por default) — sem precisar de um passo "criar link"
  // separado, o design (toggle já visível na 1ª visita à aba) não tem esse
  // passo intermediário.
  private async ensureShare(userId: string): Promise<ShareWithGrants> {
    const existing = await this.prisma.calendarShare.findUnique({
      where: { userId },
      include: GRANTS_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.calendarShare.create({
      data: { userId },
      include: GRANTS_INCLUDE,
    });
  }
}
