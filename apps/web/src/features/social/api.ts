import type { CalendarBoard } from '../calendar/api'
import { http, streamSse } from '../../lib/http'

export interface PublicOwnerDto {
  username: string
  avatarUrl: string | null
  bio: string | null
}

export type PublicCalendarBoard = CalendarBoard & { owner: PublicOwnerDto }

export interface ShareGrantDto {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
  since: string
}

export interface ShareStatusDto {
  active: boolean
  token: string
  grants: ShareGrantDto[]
}

export interface FollowStatsDto {
  followers: number
  following: number
}

export interface DiscoverUserDto {
  id: string
  username: string
  avatarUrl: string | null
  mutualCount: number
}

export interface FollowUserDto {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
}

export interface NotificationActorDto {
  id: string
  username: string
  avatarUrl: string | null
}

export type NotificationTypeDto = 'FOLLOW' | 'COMMENT' | 'REACTION'

export interface CommentDto {
  id: string
  body: string
  createdAt: string
  author: NotificationActorDto
}

export interface NotificationDto {
  id: string
  type: NotificationTypeDto
  message: string
  read: boolean
  createdAt: string
  actor: NotificationActorDto | null
}

export const sharingApi = {
  status: () => http.get<ShareStatusDto>('/sharing'),
  toggle: () => http.post<ShareStatusDto>('/sharing/toggle'),
  invite: (username: string) => http.post<ShareStatusDto>('/sharing/invite', { username }),
  revoke: (grantId: string) => http.delete<void>(`/sharing/grants/${grantId}`),
  // Público — sem Authorization, é o que quem recebe o link acessa.
  publicBoard: (token: string) => http.get<PublicCalendarBoard>(`/sharing/public/${token}`),
}

export interface PublicProfileDto {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
  followers: number
  following: number
  isFollowedByMe: boolean
  isFollowingMe: boolean
  stats: {
    totalWatched: number
    avgRating: number | null
    totalHours: number
    episodesPerWeek: number
    genreRanking: { name: string; count: number; pct: number }[]
    monthly: { label: string; count: number }[]
    statusBreakdown: { status: string; count: number }[]
  } | null
}

export const socialApi = {
  stats: () => http.get<FollowStatsDto>('/social/stats'),
  discover: () => http.get<DiscoverUserDto[]>('/social/discover'),
  follow: (username: string) => http.post<void>(`/social/users/${username}/follow`),
  unfollow: (username: string) => http.delete<void>(`/social/users/${username}/follow`),
  following: () => http.get<FollowUserDto[]>('/social/following'),
  followers: () => http.get<FollowUserDto[]>('/social/followers'),
  profile: (username: string) => http.get<PublicProfileDto>(`/social/users/${username}`),
  notifications: () => http.get<NotificationDto[]>('/social/notifications'),
  markRead: (id: string) => http.patch<void>(`/social/notifications/${id}/read`),
  markAllRead: () => http.patch<void>('/social/notifications/read-all'),
  entryComments: (entryId: string) => http.get<CommentDto[]>(`/social/entries/${entryId}/comments`),
  addComment: (entryId: string, body: string) =>
    http.post<CommentDto>(`/social/entries/${entryId}/comments`, { body }),
  removeComment: (id: string) => http.delete<void>(`/social/comments/${id}`),
  toggleReaction: (entryId: string) =>
    http.post<{ reacted: boolean }>(`/social/entries/${entryId}/reactions`),
  // ids vazio não bate a rede à toa — board sem nenhum card não tem o que perguntar.
  myReactions: (entryIds: string[]) =>
    entryIds.length === 0
      ? Promise.resolve([])
      : http.get<string[]>(`/social/reactions/mine?ids=${entryIds.join(',')}`),
  streamNotifications: (onNotification: (notification: NotificationDto) => void) =>
    streamSse('/social/notifications/stream', (raw) => {
      onNotification(JSON.parse(raw) as NotificationDto)
    }),
}
