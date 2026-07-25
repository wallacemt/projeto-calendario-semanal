import { defineStore } from 'pinia'
import type { CreateThemeInput } from '@aniweek/shared'
import { HttpError } from '../../lib/http'
import { useToastStore } from '../../stores/toast'
import { useThemeStore } from '../../stores/theme'
import { themeApi, type ThemeDto } from './api'

// Store da tela do editor (M7) — CRUD dos temas salvos. Deliberadamente
// separada de stores/theme.ts: aquela é o "aplicador" global de CSS vars
// (roda em toda rota autenticada, precisa existir desde o boot); esta é
// estado só da tela /themes (lista, loading, saving).
export const useThemeEditorStore = defineStore('theme-editor', {
  state: () => ({
    themes: [] as ThemeDto[],
    loading: false,
    saving: false,
  }),
  actions: {
    async fetch() {
      this.loading = true
      try {
        this.themes = await themeApi.list()
      } finally {
        this.loading = false
      }
    },

    async create(input: CreateThemeInput): Promise<ThemeDto> {
      this.saving = true
      try {
        const created = await themeApi.create(input)
        this.themes.unshift(created)
        return created
      } finally {
        this.saving = false
      }
    },

    async rename(id: string, name: string) {
      const toast = useToastStore()
      try {
        const updated = await themeApi.update(id, { name })
        const idx = this.themes.findIndex((t) => t.id === id)
        if (idx !== -1) this.themes[idx] = updated
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao renomear tema')
      }
    },

    async remove(id: string) {
      const toast = useToastStore()
      const runtime = useThemeStore()
      try {
        await themeApi.remove(id)
        this.themes = this.themes.filter((t) => t.id !== id)
        // Era o tema ativo? O backend já voltou o user pro modo auto
        // (onDelete: SetNull no schema) — refaz a resolução local pra
        // refletir isso na UI sem precisar de reload.
        if (runtime.activeTheme?.id === id) await runtime.fetchActiveTheme()
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao remover tema')
      }
    },

    // themeId null = modo "auto" (segue a estação).
    async activate(themeId: string | null) {
      const toast = useToastStore()
      const runtime = useThemeStore()
      try {
        await themeApi.setActive({ themeId })
        await runtime.fetchActiveTheme()
        toast.push(themeId ? 'Tema aplicado' : 'Modo automático ativado', 'success')
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao aplicar tema')
      }
    },

    async uploadBgImage(id: string, file: File) {
      const toast = useToastStore()
      const runtime = useThemeStore()
      try {
        const { bgImageUrl } = await themeApi.uploadBgImage(id, file)
        const idx = this.themes.findIndex((t) => t.id === id)
        if (idx !== -1) this.themes[idx]!.bgImageUrl = bgImageUrl
        if (runtime.activeTheme?.id === id) await runtime.fetchActiveTheme()
      } catch (err) {
        toast.push(err instanceof HttpError ? err.message : 'Erro ao enviar imagem de fundo')
      }
    },
  },
})
