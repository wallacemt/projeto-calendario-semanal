import { defineStore } from 'pinia'
import type { UpdateEntryInput, Weekday } from '@aniweek/shared'
import { HttpError } from '../../lib/http'
import { useToastStore } from '../../stores/toast'
import { calendarApi, type CalendarBoard, type CalendarEntryResponse } from './api'

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    board: null as CalendarBoard | null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.loading = true
      this.error = null
      try {
        this.board = await calendarApi.getCurrent()
      } catch (err) {
        if (err instanceof HttpError && err.status === 404) {
          // Primeira vez nesta estação: ainda não existe Calendar pra ela.
          // A estação atual já é conhecida (mesma rota pública usada no
          // boot/hero — ver stores/theme.ts), então cria na hora em vez de
          // exigir um passo manual de "criar calendário" no MVP.
          try {
            const { season, year } = await calendarApi.getCurrentSeason()
            await calendarApi.create({ season, year })
            this.board = await calendarApi.getCurrent()
          } catch (createErr) {
            this.error = createErr instanceof HttpError ? createErr.message : 'Erro ao criar calendário'
          }
        } else {
          this.error = err instanceof HttpError ? err.message : 'Erro ao carregar o calendário'
        }
      } finally {
        this.loading = false
      }
    },

    async addEntry(weekday: Weekday, malId: number) {
      if (!this.board) return
      const entry = await calendarApi.addEntry(this.board.id, { malId, weekday })
      this.board.entries[weekday].push(entry)
    },

    async removeEntry(weekday: Weekday, entryId: string) {
      if (!this.board) return
      const list = this.board.entries[weekday]
      const index = list.findIndex((e) => e.id === entryId)
      if (index === -1) return
      // Otimista: remove da UI na hora, desfaz se a chamada falhar — evita
      // esperar o round-trip pra um "x" que quase sempre funciona.
      const [removed] = list.splice(index, 1)
      try {
        await calendarApi.removeEntry(entryId)
      } catch (err) {
        list.splice(index, 0, removed)
        useToastStore().push(err instanceof HttpError ? err.message : 'Erro ao remover entrada')
      }
    },

    // M5/AC-05: o VueDraggable já moveu o card entre os arrays na hora (é o
    // v-model dele) — aqui só persiste. Se falhar, resincroniza com o
    // servidor em vez de tentar desfazer o splice manualmente.
    //
    // Erro de ação (aqui, remove, updateProgress) vai pro toast, não pro
    // `this.error` — esse campo é lido pela view só pra decidir entre
    // "mostrar o board" e "mostrar tela de erro" (load() falhou, sem dado
    // nenhum pra exibir). Se uma falha de reorder setasse `this.error`, o
    // board inteiro já carregado sumiria da tela por causa de uma ação
    // pontual que não tem nada a ver com "não consegui carregar o calendário".
    async moveEntry(entryId: string, weekday: Weekday, position: number) {
      try {
        await calendarApi.moveEntry(entryId, { weekday, position })
      } catch (err) {
        useToastStore().push(err instanceof HttpError ? err.message : 'Erro ao mover entrada')
        await this.load()
      }
    },

    async updateProgress(weekday: Weekday, entryId: string, currentEpisode: number) {
      if (!this.board) return
      const entry = this.board.entries[weekday].find((e) => e.id === entryId)
      if (!entry) return
      const previous = { currentEpisode: entry.currentEpisode, status: entry.status }
      entry.currentEpisode = currentEpisode
      try {
        const updated = await calendarApi.updateProgress(entryId, { currentEpisode })
        entry.status = updated.status
      } catch (err) {
        entry.currentEpisode = previous.currentEpisode
        entry.status = previous.status
        useToastStore().push(err instanceof HttpError ? err.message : 'Erro ao atualizar progresso')
      }
    },

    // M6 (fora do blueprint): PATCH único do modal de editar card. Não
    // engole erro (ao contrário de removeEntry/updateProgress, que são
    // otimistas) — quem chama é um form de modal, o padrão aqui é o mesmo do
    // addEntry: deixa a exceção subir pra quem submeteu decidir se fecha o
    // modal ou mostra o erro e mantém aberto.
    async updateEntry(oldWeekday: Weekday, entryId: string, patch: UpdateEntryInput) {
      if (!this.board) return
      const updated = await calendarApi.updateEntry(entryId, patch)
      const oldList = this.board.entries[oldWeekday]
      const idx = oldList.findIndex((e) => e.id === entryId)
      if (idx !== -1) oldList.splice(idx, 1)
      if (updated.weekday === oldWeekday && idx !== -1) {
        oldList.splice(idx, 0, updated)
      } else {
        this.board.entries[updated.weekday].push(updated)
      }
    },

    // M6 (fora do blueprint): merge local puro, sem round-trip — o form do
    // EditEntryModal já chamou PATCH /animes/:id e sabe exatamente quais
    // campos mudaram, então só espelha isso no card em vez de recarregar o
    // board inteiro por causa de 1 campo de texto.
    patchAnime(entryId: string, patch: Partial<CalendarEntryResponse['anime']>) {
      if (!this.board) return
      for (const list of Object.values(this.board.entries)) {
        const entry = list.find((e) => e.id === entryId)
        if (entry) {
          Object.assign(entry.anime, patch)
          return
        }
      }
    },

    // Bulk (AC-04) — botão "Importar da temporada anterior" na topbar, 1
    // clique, sem modal. Erro/sucesso viram toast direto (não há form pra
    // manter aberto em caso de falha).
    async importPreviousBulk() {
      if (!this.board) return
      try {
        const created = await calendarApi.importPrevious(this.board.id, {})
        for (const entry of created) {
          this.board.entries[entry.weekday].push(entry)
        }
        useToastStore().push(
          created.length > 0
            ? `${created.length} anime(s) trazido(s) da temporada anterior`
            : 'Nada para trazer da temporada anterior',
        )
      } catch (err) {
        useToastStore().push(err instanceof HttpError ? err.message : 'Erro ao importar da temporada anterior')
      }
    },
  },
})
