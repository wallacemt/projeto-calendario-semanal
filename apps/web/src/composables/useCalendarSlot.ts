import { computed, onMounted, ref, type Ref } from 'vue'
import type { Weekday } from '@aniweek/shared'
import { HttpError } from '../lib/http'
import { useToastStore } from '../stores/toast'
import { useCalendarStore } from '../features/calendar/store'

// Usado por AnimeDetailPanel e AnimeDetailView (M3/M4) pra responder "esse
// anime já está no meu calendário, em qual dia?" e deixar clicar num dia pra
// adicionar (malId ainda não tem entry) ou trocar (já tem, muda de weekday) —
// mesma store/board do CalendarView, sem endpoint novo: procurar nas 8
// colunas já carregadas é O(entries), board de 1 usuário nunca é grande o
// bastante pra isso importar.
export function useCalendarSlot(malId: Ref<number | undefined>) {
  const calendar = useCalendarStore()
  const toast = useToastStore()

  onMounted(() => {
    if (!calendar.board) void calendar.load()
  })

  const entry = computed(() => {
    if (!calendar.board || malId.value == null) return null
    for (const list of Object.values(calendar.board.entries)) {
      const found = list.find((e) => e.anime.malId === malId.value)
      if (found) return found
    }
    return null
  })

  const pending = ref(false)

  async function setWeekday(weekday: Weekday) {
    if (malId.value == null || pending.value) return
    if (entry.value?.weekday === weekday) return
    pending.value = true
    try {
      if (entry.value) {
        await calendar.updateEntry(entry.value.weekday, entry.value.id, { weekday })
      } else {
        await calendar.addEntry(weekday, malId.value)
      }
    } catch (err) {
      toast.push(err instanceof HttpError ? err.message : 'Erro ao atualizar o calendário')
    } finally {
      pending.value = false
    }
  }

  return { entry, pending, setWeekday }
}
