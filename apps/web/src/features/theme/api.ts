import type { ActivateThemeInput, CreateThemeInput, Season, UpdateThemeInput } from '@aniweek/shared'
import { http } from '../../lib/http'

export interface ThemeDto {
  id: string
  name: string
  accent: string
  accent2: string
  bgImageUrl: string | null
  season: Season | null
  createdAt: string
}

export const themeApi = {
  list: () => http.get<ThemeDto[]>('/themes'),
  create: (input: CreateThemeInput) => http.post<ThemeDto>('/themes', input),
  update: (id: string, input: UpdateThemeInput) => http.patch<ThemeDto>(`/themes/${id}`, input),
  remove: (id: string) => http.delete<void>(`/themes/${id}`),
  uploadBgImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<{ bgImageUrl: string }>(`/themes/${id}/bg-image`, form)
  },
  getActive: () => http.get<ThemeDto | null>('/themes/active'),
  setActive: (input: ActivateThemeInput) =>
    http.patch<{ activeThemeId: string | null }>('/themes/active', input),
}
