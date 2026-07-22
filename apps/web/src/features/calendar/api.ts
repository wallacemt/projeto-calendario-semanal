import type {
  AddEntryInput,
  CreateCalendarInput,
  EntryStatus,
  MoveEntryInput,
  Season,
  UpdateProgressInput,
  Weekday,
} from '@aniweek/shared'
import { http } from '../../lib/http'

export interface CurrentSeasonResponse {
  season: Season
  year: number
}

export interface CalendarSummary {
  id: string
  season: Season
  year: number
  createdAt: string
}

export interface CalendarEntryResponse {
  id: string
  weekday: Weekday
  position: number
  currentEpisode: number
  totalEpisodes: number | null
  status: EntryStatus
  anime: { id: string; malId: number; title: string; imageUrl: string | null }
}

export type CalendarBoard = CalendarSummary & {
  entries: Record<Weekday, CalendarEntryResponse[]>
}

export const calendarApi = {
  // Público (sem auth) — precisa responder antes do login, é usado no boot do
  // app e no hero das telas de auth (ver stores/theme.ts).
  getCurrentSeason: () => http.get<CurrentSeasonResponse>('/calendars/current-season'),

  list: () => http.get<CalendarSummary[]>('/calendars'),
  create: (input: CreateCalendarInput) => http.post<CalendarSummary>('/calendars', input),
  getCurrent: () => http.get<CalendarBoard>('/calendars/current'),
  addEntry: (calendarId: string, input: AddEntryInput) =>
    http.post<CalendarEntryResponse>(`/calendars/${calendarId}/entries`, input),
  removeEntry: (entryId: string) => http.delete<void>(`/entries/${entryId}`),
  moveEntry: (entryId: string, input: MoveEntryInput) =>
    http.patch<CalendarEntryResponse>(`/entries/${entryId}/move`, input),
  updateProgress: (entryId: string, input: UpdateProgressInput) =>
    http.patch<CalendarEntryResponse>(`/entries/${entryId}/progress`, input),
}
