<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Weekday } from '@aniweek/shared'
import AppShell from '../../../components/AppShell.vue'
import AddEntryModal from '../components/AddEntryModal.vue'
import EntryCard from '../components/EntryCard.vue'
import { useCalendarStore } from '../store'

const calendar = useCalendarStore()
onMounted(() => calendar.load())

// Ordem fixa do board (RF-04): 7 dias + BACKLOG (aba "extra" do legado —
// ADR-08). Sem dependência nova: datas da semana calculadas com Date nativo,
// não precisa de date-fns só pra formatar "21 Jul" no front (date-fns já é
// usado no backend, aqui é 1 função pequena).
const DAY_DEFS: { key: Weekday; short: string; isExtra?: boolean }[] = [
  { key: Weekday.MON, short: 'SEG' },
  { key: Weekday.TUE, short: 'TER' },
  { key: Weekday.WED, short: 'QUA' },
  { key: Weekday.THU, short: 'QUI' },
  { key: Weekday.FRI, short: 'SEX' },
  { key: Weekday.SAT, short: 'SÁB' },
  { key: Weekday.SUN, short: 'DOM' },
  { key: Weekday.BACKLOG, short: '🗂 EXTRA', isExtra: true },
]

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function currentWeekMonday(): Date {
  const now = new Date()
  const day = now.getDay() // 0=dom..6=sáb
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  return monday
}

const weekDates = (() => {
  const monday = currentWeekMonday()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return dateFormatter.format(d)
  })
})()

const days = computed(() =>
  DAY_DEFS.map((d, i) => ({
    ...d,
    date: d.isExtra ? 'Backlog' : weekDates[i],
    entries: calendar.board?.entries[d.key] ?? [],
  })),
)

const totalEntries = computed(() => days.value.reduce((sum, d) => sum + d.entries.length, 0))

const addModalWeekday = ref<Weekday | null>(null)
const addModalLabel = ref('')
function openAddModal(weekday: Weekday, label: string) {
  addModalWeekday.value = weekday
  addModalLabel.value = label
}
</script>

<template>
  <AppShell title="Calendário Semanal" :subtitle="`${totalEntries} animes na semana`">
    <div class="flex h-full flex-col">
      <p v-if="calendar.loading" class="p-8 text-sm text-(--ink-text-faint)">Carregando calendário...</p>
      <p v-else-if="calendar.error" class="p-8 text-sm text-(--ink-error)">{{ calendar.error }}</p>

      <div v-else class="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-6">
        <div v-for="day in days" :key="day.key" class="flex min-w-37.5 flex-1 flex-col gap-2.5">
          <div class="flex items-center justify-between px-0.5">
            <div>
              <div
                class="font-mono text-[11px] font-bold tracking-wide"
                :style="{ color: day.isExtra ? '#FBBF24' : '#B4B8C6' }"
              >
                {{ day.short }}
              </div>
              <div class="mt-0.5 text-[10px] text-(--ink-text-faint)">{{ day.date }}</div>
            </div>
            <div
              class="flex h-5 w-5 items-center justify-center rounded-md text-[10.5px] font-bold text-(--ink-text-muted)"
              style="background: rgba(255, 255, 255, 0.06)"
            >
              {{ day.entries.length }}
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-1">
            <EntryCard
              v-for="entry in day.entries"
              :key="entry.id"
              :entry="entry"
              @remove="calendar.removeEntry(day.key, entry.id)"
            />
          </div>

          <button
            type="button"
            class="h-9.5 flex-shrink-0 rounded-[10px] border border-dashed text-[11px] text-(--ink-text-faint) hover:border-(--brand-secondary)/40 hover:text-(--brand-secondary)"
            style="border-color: rgba(255, 255, 255, 0.15)"
            @click="openAddModal(day.key, `${day.short}${day.isExtra ? '' : ` · ${day.date}`}`)"
          >
            + Adicionar
          </button>
        </div>
      </div>
    </div>

    <AddEntryModal
      v-if="addModalWeekday"
      :weekday="addModalWeekday"
      :weekday-label="addModalLabel"
      @close="addModalWeekday = null"
    />
  </AppShell>
</template>
