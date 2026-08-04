import { defineStore } from 'pinia'
import { HttpError } from '../../lib/http'
import { useToastStore } from '../../stores/toast'
import {
  sharingApi,
  socialApi,
  type DiscoverUserDto,
  type FollowStatsDto,
  type FollowUserDto,
  type NotificationDto,
  type ShareStatusDto,
} from './api'

export const useSocialStore = defineStore('social', {
  state: () => ({
    share: null as ShareStatusDto | null,
    shareLoading: false,
    inviting: false,

    stats: null as FollowStatsDto | null,
    suggestions: [] as DiscoverUserDto[],
    discoverLoading: false,

    following: [] as FollowUserDto[],
    followers: [] as FollowUserDto[],
    followingLoading: false,
    followersLoading: false,

    notifications: [] as NotificationDto[],
    notificationsLoading: false,

    // Função de cleanup do streamSse (ver lib/http.ts) — não é state
    // reativo de verdade (é uma closure), mas mora aqui pra App.vue não
    // precisar guardar essa referência separada da store.
    stopStream: null as (() => void) | null,
  }),
  getters: {
    unreadCount: (state) => state.notifications.filter((n) => !n.read).length,
  },
  actions: {
    async fetchShare() {
      this.shareLoading = true
      try {
        this.share = await sharingApi.status()
      } finally {
        this.shareLoading = false
      }
    },

    async toggleShare() {
      const toast = useToastStore()
      try {
        this.share = await sharingApi.toggle()
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao atualizar o link')
      }
    },

    async invite(username: string): Promise<boolean> {
      const toast = useToastStore()
      this.inviting = true
      try {
        this.share = await sharingApi.invite(username)
        toast.push('Convite enviado', 'success')
        return true
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao convidar usuário')
        return false
      } finally {
        this.inviting = false
      }
    },

    async revoke(grantId: string) {
      const toast = useToastStore()
      try {
        await sharingApi.revoke(grantId)
        if (this.share) {
          this.share = { ...this.share, grants: this.share.grants.filter((g) => g.id !== grantId) }
        }
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao revogar acesso')
      }
    },

    async fetchStats() {
      this.stats = await socialApi.stats()
    },

    async fetchSuggestions() {
      this.discoverLoading = true
      try {
        this.suggestions = await socialApi.discover()
      } finally {
        this.discoverLoading = false
      }
    },

    // Sem "deixar de seguir" aqui de propósito: quem já sigo nunca aparece
    // de novo em discover() (o backend já exclui — ver SocialService.discover),
    // então a sugestão só some da lista depois de seguida, sem alternar de
    // volta pra "+ Seguir" (o design mostra um toggle, mas a semântica real
    // do backend é "descobrir gente nova", não "gerenciar quem eu sigo").
    async followSuggestion(user: DiscoverUserDto) {
      const toast = useToastStore()
      try {
        await socialApi.follow(user.username)
        this.suggestions = this.suggestions.filter((s) => s.id !== user.id)
        if (this.stats) this.stats = { ...this.stats, following: this.stats.following + 1 }
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao seguir usuário')
      }
    },

    async fetchFollowing() {
      this.followingLoading = true
      try {
        this.following = await socialApi.following()
      } finally {
        this.followingLoading = false
      }
    },

    async fetchFollowers() {
      this.followersLoading = true
      try {
        this.followers = await socialApi.followers()
      } finally {
        this.followersLoading = false
      }
    },

    async unfollow(username: string) {
      const toast = useToastStore()
      try {
        await socialApi.unfollow(username)
        this.following = this.following.filter((u) => u.username !== username)
        if (this.stats) this.stats = { ...this.stats, following: Math.max(0, this.stats.following - 1) }
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao deixar de seguir')
      }
    },

    async fetchNotifications() {
      this.notificationsLoading = true
      try {
        this.notifications = await socialApi.notifications()
      } finally {
        this.notificationsLoading = false
      }
    },

    // Otimista com rollback (mesmo padrão de qualquer toggle de UI que não
    // quer esperar o round-trip pra parecer responsivo) — se o PATCH falhar,
    // volta pro estado anterior em vez de deixar a UI mentindo.
    async markRead(id: string) {
      const notif = this.notifications.find((n) => n.id === id)
      if (!notif || notif.read) return
      notif.read = true
      try {
        await socialApi.markRead(id)
      } catch {
        notif.read = false
      }
    },

    async markAllRead() {
      const unread = this.notifications.filter((n) => !n.read)
      if (unread.length === 0) return
      unread.forEach((n) => (n.read = true))
      try {
        await socialApi.markAllRead()
      } catch {
        unread.forEach((n) => (n.read = false))
      }
    },

    // Idempotente — App.vue chama isso sempre que auth.isAuthenticated vira
    // true; se já existe uma conexão em voo, não abre uma segunda.
    connectStream() {
      if (this.stopStream) return
      this.stopStream = socialApi.streamNotifications((notification) => {
        this.notifications = [notification, ...this.notifications]
      })
    },

    disconnectStream() {
      this.stopStream?.()
      this.stopStream = null
    },
  },
})
