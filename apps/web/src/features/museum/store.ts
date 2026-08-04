import { defineStore } from 'pinia'
import type { CreateWatchedAnimeInput, UpdateWatchedAnimeInput } from '@aniweek/shared'
import { HttpError } from '../../lib/http'
import { useToastStore } from '../../stores/toast'
import { museumApi, type MuseumStatsDto, type WatchedAnimeDto } from './api'

// Estado da vitrine (RF-09) + das métricas (RF-10) — telas separadas
// (/museu e /estatisticas, ver AppSidebar) mas mesma store: ambas leem do
// mesmo "acervo" e a stats muda quando um item é adicionado/removido.
export const useMuseumStore = defineStore('museum', {
  state: () => ({
    trophies: [] as WatchedAnimeDto[],
    stats: null as MuseumStatsDto | null,
    loading: false,
    statsLoading: false,
    saving: false,
  }),
  actions: {
    async fetchTrophies() {
      this.loading = true
      try {
        this.trophies = await museumApi.list()
      } finally {
        this.loading = false
      }
    },

    async fetchStats() {
      this.statsLoading = true
      try {
        this.stats = await museumApi.stats()
      } finally {
        this.statsLoading = false
      }
    },

    // `featured` é resolvido no backend olhando o acervo inteiro (pin manual
    // ou o mais recente) — por isso add/update/remove/setFeatured sempre
    // re-buscam a lista inteira em vez de só mesclar o item que mudou: mexer
    // num item pode "desfeaturar" outro que ficou em memória com o flag antigo.
    async add(input: CreateWatchedAnimeInput): Promise<WatchedAnimeDto | null> {
      const toast = useToastStore()
      this.saving = true
      try {
        const created = await museumApi.create(input)
        await this.fetchTrophies()
        toast.push('Adicionado ao museu', 'success')
        return created
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao adicionar ao museu')
        return null
      } finally {
        this.saving = false
      }
    },

    async update(id: string, input: UpdateWatchedAnimeInput) {
      const toast = useToastStore()
      this.saving = true
      try {
        await museumApi.update(id, input)
        await this.fetchTrophies()
        return true
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao editar registro')
        return false
      } finally {
        this.saving = false
      }
    },

    async remove(id: string) {
      const toast = useToastStore()
      try {
        await museumApi.remove(id)
        await this.fetchTrophies()
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao remover do museu')
      }
    },

    // watchedAnimeId null = desfixar (volta pro modo auto).
    async setFeatured(watchedAnimeId: string | null) {
      const toast = useToastStore()
      try {
        await museumApi.setFeatured(watchedAnimeId)
        await this.fetchTrophies()
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao fixar destaque')
      }
    },
  },
})
