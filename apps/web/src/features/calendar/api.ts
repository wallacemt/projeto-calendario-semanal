import type { Season } from '@aniweek/shared'
import { http } from '../../lib/http'

export interface CurrentSeasonResponse {
  season: Season
  year: number
}

// Público (sem auth) — precisa responder antes do login, é usado no boot do
// app e no hero das telas de auth (ver stores/theme.ts).
export const calendarApi = {
  getCurrentSeason: () => http.get<CurrentSeasonResponse>('/calendars/current-season'),
}
