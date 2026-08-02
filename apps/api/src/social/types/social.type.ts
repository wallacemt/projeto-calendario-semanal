import type {
  Comment,
  Notification,
  User,
} from '../../../generated/prisma/client';
import type { MuseumStatsResponse } from '../../museum/museum.service';

export interface FollowStatsResponse {
  followers: number;
  following: number;
}

export interface DiscoverUserResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
  mutualCount: number;
}

export interface NotificationActorResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface NotificationResponse {
  id: string;
  type: Notification['type'];
  message: string;
  read: boolean;
  createdAt: Date;
  actor: NotificationActorResponse | null;
}

type NotificationWithActor = Notification & { actor: User | null };

export function toNotificationResponse(
  notification: NotificationWithActor,
): NotificationResponse {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt,
    actor: notification.actor
      ? {
          id: notification.actor.id,
          username: notification.actor.username,
          avatarUrl: notification.actor.avatarUrl,
        }
      : null,
  };
}

export interface FollowUserResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export function toFollowUserResponse(user: User): FollowUserResponse {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}

// Perfil público (M10/LGPD — RF-11). stats vem null quando o próprio dono
// optou por ocultar (User.statsPublic=false) — o front trata null como "esse
// usuário não compartilha estatísticas", nunca como "carregando" ou "erro".
export interface PublicProfileResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  followers: number;
  following: number;
  isFollowedByMe: boolean;
  isFollowingMe: boolean;
  stats: MuseumStatsResponse | null;
}

export interface CommentResponse {
  id: string;
  body: string;
  createdAt: Date;
  author: NotificationActorResponse;
}

type CommentWithAuthor = Comment & { author: User };

export function toCommentResponse(comment: CommentWithAuthor): CommentResponse {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      avatarUrl: comment.author.avatarUrl,
    },
  };
}
