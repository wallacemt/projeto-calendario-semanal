import { defineStore } from 'pinia'
import type { Weekday } from '@aniweek/shared'
import { HttpError } from '../../lib/http'
import { useToastStore } from '../../stores/toast'
import { calendarApi, type CalendarBoard } from './api'

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
  },
})
