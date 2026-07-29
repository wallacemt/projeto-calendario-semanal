import type { CreateWatchedAnimeInput, Season, UpdateWatchedAnimeInput } from '@aniweek/shared'
import { http } from '../../lib/http'

export interface WatchedAnimeDto {
  id: string
  rating: number | null
  comment: string | null
  completedAt: string
  watchedSeason: Season | null
  watchedYear: number | null
  featured: boolean
  anime: {
    id: string
    malId: number
    title: string
    imageUrl: string | null
    episodes: number | null
    genres: string[]
  }
}

export interface MuseumStatsDto {
  totalWatched: number
  avgRating: number | null
  totalHours: number
  episodesPerWeek: number
  genreRanking: { name: string; count: number; pct: number }[]
  monthly: { label: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
}

export const museumApi = {
  list: () => http.get<WatchedAnimeDto[]>('/museum'),
  create: (input: CreateWatchedAnimeInput) => http.post<WatchedAnimeDto>('/museum', input),
  update: (id: string, input: UpdateWatchedAnimeInput) =>
    http.patch<WatchedAnimeDto>(`/museum/${id}`, input),
  remove: (id: string) => http.delete<void>(`/museum/${id}`),
  stats: () => http.get<MuseumStatsDto>('/museum/stats'),
  setFeatured: (watchedAnimeId: string | null) =>
    http.patch<{ featuredWatchedAnimeId: string | null }>('/museum/featured', { watchedAnimeId }),
}
