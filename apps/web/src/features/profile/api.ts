import type { AuthProvider, UpdateProfileInput } from '@aniweek/shared'
import { http } from '../../lib/http'

export interface ProfileStats {
  totalAnimesInCalendar: number
}

export interface Profile {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  bio: string | null
  emailVerified: boolean
  createdAt: string
  stats: ProfileStats
  connectedProviders: AuthProvider[]
}

export const profileApi = {
  me: () => http.get<Profile>('/users/me'),
  update: (input: UpdateProfileInput) => http.patch<Profile>('/users/me', input),
  deleteAccount: () => http.delete<void>('/users/me'),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<{ avatarUrl: string }>('/users/me/avatar', form)
  },
}
