import {
  BadRequestException,
  Injectable,
  NotFoundException,
  type MessageEvent,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationType } from '../../generated/prisma/client';
import { MuseumService } from '../museum/museum.service';
import { NotificationEventsService } from './notification-events.service';
import {
  toCommentResponse,
  toFollowUserResponse,
  toNotificationResponse,
  type CommentResponse,
  type DiscoverUserResponse,
  type FollowStatsResponse,
  type FollowUserResponse,
  type NotificationResponse,
  type PublicProfileResponse,
} from './types/social.type';

const DISCOVER_LIMIT = 10;
const NOTIFICATIONS_LIMIT = 50;
const NOTIF_INCLUDE = { actor: true } as const;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Dona de Follow/Notification/Comment/Reaction (M10 — RF-11). Segue o mesmo
// padrão 404-não-403 (findOwned) do resto do app onde a operação é
// destrutiva/sensível — ver revokeGrant do SharingService para o mesmo
// raciocínio aplicado a compartilhamento.
@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: NotificationEventsService,
    private readonly museum: MuseumService,
  ) {}

  async follow(followerId: string, username: string): Promise<void> {
    const target = await this.findUserByUsername(username);
    if (target.id === followerId) {
      throw new BadRequestException('Você não pode seguir a si mesmo');
    }

    try {
      await this.prisma.follow.create({
        data: { followerId, followingId: target.id },
      });
    } catch (error) {
      // Já segue — idempotente (clicar "Seguir" 2x não deve gerar 2
      // notificações nem erro visível pro usuário).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }

    await this.notify(target.id, {
      type: NotificationType.FOLLOW,
      actorId: followerId,
      message: 'começou a seguir você.',
    });
  }

  async unfollow(followerId: string, username: string): Promise<void> {
    const target = await this.findUserByUsername(username);
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
  }

  async stats(userId: string): Promise<FollowStatsResponse> {
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }

  async listFollowing(userId: string): Promise<FollowUserResponse[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { followee: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toFollowUserResponse(row.followee));
  }

  async listFollowers(userId: string): Promise<FollowUserResponse[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toFollowUserResponse(row.follower));
  }

  // Perfil público (M10/LGPD — RF-11). username, não id, na URL: é o que
  // aparece em qualquer lugar que já lista pessoas (grants, discover,
  // notificações) — resolver por id exigiria expor o cuid em cada link.
  async getPublicProfile(
    username: string,
    viewerId: string,
  ): Promise<PublicProfileResponse> {
    const user = await this.findUserByUsername(username);

    const [followers, following, viewerFollowsThem, theyFollowViewer] =
      await Promise.all([
        this.prisma.follow.count({ where: { followingId: user.id } }),
        this.prisma.follow.count({ where: { followerId: user.id } }),
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
        }),
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: viewerId,
            },
          },
        }),
      ]);

    // Dono sempre vê as próprias stats (statsPublic só rege visibilidade PRA
    // OUTROS) — sem esse OR, o próprio usuário que desligou statsPublic não
    // veria nem o próprio perfil público completo.
    const stats =
      user.statsPublic || user.id === viewerId
        ? await this.museum.stats(user.id)
        : null;

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      followers,
      following,
      isFollowedByMe: Boolean(viewerFollowsThem),
      isFollowingMe: Boolean(theyFollowViewer),
      stats,
    };
  }

  // "Descobrir pessoas" (RF-11) — sem grafo de amizade real pra sugerir por
  // "amigo de amigo", então a base é simplesmente "gente nova que eu ainda
  // não sigo" (mais recente primeiro). mutualCount é o dado real que dá pra
  // calcular sem esse grafo: quantos de quem EU sigo também segue o
  // candidato — clássico de entrevista Prisma: 1 groupBy pro lote inteiro em
  // vez de 1 count por candidato (N+1).
  async discover(userId: string): Promise<DiscoverUserResponse[]> {
    const myFollowing = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const myFollowingIds = myFollowing.map((f) => f.followingId);

    const candidates = await this.prisma.user.findMany({
      where: { id: { notIn: [userId, ...myFollowingIds] } },
      orderBy: { createdAt: 'desc' },
      take: DISCOVER_LIMIT,
    });
    if (candidates.length === 0) return [];
    if (myFollowingIds.length === 0) {
      return candidates.map((c) => ({
        id: c.id,
        username: c.username,
        avatarUrl: c.avatarUrl,
        mutualCount: 0,
      }));
    }

    const mutuals = await this.prisma.follow.groupBy({
      by: ['followingId'],
      where: {
        followerId: { in: myFollowingIds },
        followingId: { in: candidates.map((c) => c.id) },
      },
      _count: true,
    });
    const mutualByUserId = new Map(
      mutuals.map((m) => [m.followingId, m._count]),
    );

    return candidates.map((c) => ({
      id: c.id,
      username: c.username,
      avatarUrl: c.avatarUrl,
      mutualCount: mutualByUserId.get(c.id) ?? 0,
    }));
  }

  async listNotifications(userId: string): Promise<NotificationResponse[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: NOTIF_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: NOTIFICATIONS_LIMIT,
    });
    return notifications.map(toNotificationResponse);
  }

  async markRead(id: string, userId: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    if (result.count === 0) {
      throw new NotFoundException('Notificação não encontrada');
    }
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  stream(userId: string): Observable<MessageEvent> {
    return this.events.stream(userId);
  }

  async addComment(
    entryId: string,
    authorId: string,
    body: string,
  ): Promise<CommentResponse> {
    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId },
      include: { anime: true, calendar: true },
    });
    if (!entry) throw new NotFoundException('Card não encontrado');

    const comment = await this.prisma.comment.create({
      data: { entryId, authorId, body },
      include: { author: true },
    });

    if (entry.calendar.userId !== authorId) {
      await this.notify(entry.calendar.userId, {
        type: NotificationType.COMMENT,
        actorId: authorId,
        entryId,
        message: `comentou em ${entry.anime.title}: "${truncate(body, 60)}"`,
      });
    }

    return toCommentResponse(comment);
  }

  async listComments(entryId: string): Promise<CommentResponse[]> {
    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Card não encontrado');

    const comments = await this.prisma.comment.findMany({
      where: { entryId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map(toCommentResponse);
  }

  // Batch pro board não fazer 1 GET por card só pra saber se o viewer já
  // reagiu (mesmo raciocínio anti-N+1 do mutualCount em discover()). Teto
  // defensivo: entryIds vem de query string de um endpoint autenticado
  // qualquer, sem vínculo com "board de um dono só" — sem cap, um client mal-
  // intencionado poderia mandar uma lista arbitrariamente grande.
  async myReactions(userId: string, entryIds: string[]): Promise<string[]> {
    const ids = entryIds.slice(0, 200);
    if (ids.length === 0) return [];
    const rows = await this.prisma.reaction.findMany({
      where: { userId, entryId: { in: ids } },
      select: { entryId: true },
    });
    return rows.map((r) => r.entryId);
  }

  async removeComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, author: { id: userId } },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  // Toggle (RF-11): reagir de novo no mesmo card desfaz a reação — @@unique
  // no schema é o que torna isso uma decisão segura (não dá pra empilhar 2
  // reações da mesma pessoa por acidente numa corrida).
  async toggleReaction(
    entryId: string,
    userId: string,
  ): Promise<{ reacted: boolean }> {
    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId },
      include: { anime: true, calendar: true },
    });
    if (!entry) throw new NotFoundException('Card não encontrado');

    const existing = await this.prisma.reaction.findUnique({
      where: { entryId_userId: { entryId, userId } },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { reacted: false };
    }

    await this.prisma.reaction.create({ data: { entryId, userId } });
    if (entry.calendar.userId !== userId) {
      await this.notify(entry.calendar.userId, {
        type: NotificationType.REACTION,
        actorId: userId,
        entryId,
        message: `reagiu ao seu progresso em ${entry.anime.title}.`,
      });
    }
    return { reacted: true };
  }

  private async findUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  private async notify(
    userId: string,
    input: {
      type: NotificationType;
      actorId?: string;
      entryId?: string;
      message: string;
    },
  ): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: { userId, ...input },
      include: NOTIF_INCLUDE,
    });
    this.events.emit(userId, toNotificationResponse(notification));
  }
}
