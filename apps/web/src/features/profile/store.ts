import { defineStore } from 'pinia'
import type { UpdateProfileInput } from '@aniweek/shared'
import { useAuthStore } from '../../stores/auth'
import { profileApi, type Profile } from './api'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as Profile | null,
    loading: false,
  }),
  actions: {
    async fetch() {
      this.loading = true
      try {
        this.profile = await profileApi.me()
      } finally {
        this.loading = false
      }
    },

    async update(input: UpdateProfileInput) {
      this.profile = await profileApi.update(input)
      this.syncAuthUser()
    },

    async uploadAvatar(file: File) {
      const { avatarUrl } = await profileApi.uploadAvatar(file)
      if (this.profile) this.profile.avatarUrl = avatarUrl
      this.syncAuthUser()
    },

    async deleteAccount() {
      await profileApi.deleteAccount()
      useAuthStore().clearSession()
    },

    // A sidebar (AppSidebar) lê avatar/username de stores/auth, não deste
    // store — mantém os dois em sincronia sem precisar de um refetch de /auth/me.
    syncAuthUser() {
      const auth = useAuthStore()
      if (auth.user && this.profile) {
        auth.user.username = this.profile.username
        auth.user.bio = this.profile.bio
        auth.user.avatarUrl = this.profile.avatarUrl
      }
    },
  },
})
