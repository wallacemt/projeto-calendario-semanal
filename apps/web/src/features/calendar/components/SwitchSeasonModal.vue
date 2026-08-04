<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Season } from '@aniweek/shared'
import { ArrowLeft, X } from 'lucide-vue-next'
import { HttpError } from '../../../lib/http'
import { seasonMeta } from '../../../lib/season-meta'
import { useToastStore } from '../../../stores/toast'
import { calendarApi, type CalendarSummary } from '../api'
import { useCalendarStore } from '../store'

const emit = defineEmits<{ close: [] }>()

const calendar = useCalendarStore()
const toast = useToastStore()

// Navegação entre estações (M6, fora do blueprint) — a pílula de temporada
// na topbar abre isto em vez de BringForwardModal (que é outra coisa:
// trazer 1 anime específico de uma temporada antiga pro board atual, sem
// trocar o board de lugar). Mesmo drill-down ano->estação daquele modal,
// só que aqui clicar numa estação TROCA o board, não navega pra "buscar anime".
const view = ref<'years' | 'seasons'>('years')
const calendars = ref<CalendarSummary[]>([])
const loading = ref(true)
const selectedYear = ref<number | null>(null)

onMounted(async () => {
  try {
    calendars.value = await calendarApi.list()
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao carregar temporadas')
  } finally {
    loading.value = false
  }
})

const SEASON_ORDER = [Season.WINTER, Season.SPRING, Season.SUMMER, Season.FALL]

const years = computed(() => {
  const byYear = new Map<number, CalendarSummary[]>()
  for (const cal of calendars.value) {
    if (!byYear.has(cal.year)) byYear.set(cal.year, [])
    byYear.get(cal.year)!.push(cal)
  }
  return Array.from(byYear.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, cals]) => ({ year, count: cals.length }))
})

const seasonsOfSelectedYear = computed(() => {
  if (selectedYear.value == null) return []
  return calendars.value
    .filter((c) => c.year === selectedYear.value)
    .sort((a, b) => SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season))
})

function openYear(year: number) {
  selectedYear.value = year
  view.value = 'seasons'
}

async function selectSeason(cal: CalendarSummary) {
  if (cal.id === calendar.board?.id) {
    emit('close')
    return
  }
  await calendar.switchTo(cal.id)
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" @click.self="emit('close')">
    <div class="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
      <div class="flex flex-shrink-0 items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="flex items-center gap-3">
          <button v-if="view === 'seasons'" type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border text-(--ink-text-muted) hover:text-(--ink-text)"
            style="border-color: rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.04)"
            @click="view = 'years'">
            <ArrowLeft :size="14" />
          </button>
          <div>
            <div class="font-display text-[15px] font-bold text-(--ink-text)">
              {{ view === 'years' ? 'Trocar temporada' : selectedYear }}
            </div>
            <div class="mt-0.5 text-[11.5px] text-(--ink-text-faint)">
              {{ view === 'years' ? 'Escolha o ano' : 'Escolha a temporada' }}
            </div>
          </div>
        </div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <p v-if="loading" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">Carregando...</p>

        <div v-else-if="view === 'years'" class="grid grid-cols-3 gap-3">
          <p v-if="years.length === 0" class="col-span-3 py-8 text-center text-[12.5px] text-(--ink-text-faint)">
            Nenhuma temporada ainda.
          </p>
          <button v-for="y in years" :key="y.year" type="button"
            class="flex flex-col items-start gap-1 rounded-xl border p-4 text-left hover:border-(--brand-secondary)/40"
            style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03)"
            @click="openYear(y.year)">
            <div class="font-mono text-[20px] font-bold text-(--ink-text)">{{ y.year }}</div>
            <div class="text-[11px] text-(--ink-text-faint)">{{ y.count }} temporada(s)</div>
          </button>
        </div>

        <div v-else class="flex flex-col gap-2">
          <div v-for="cal in seasonsOfSelectedYear" :key="cal.id"
            class="flex cursor-pointer items-center justify-between rounded-xl border p-3.5 hover:border-(--brand-secondary)/40"
            style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03)"
            @click="selectSeason(cal)">
            <div class="flex items-center gap-3">
              <span class="text-[18px]">{{ seasonMeta[cal.season].emoji }}</span>
              <div class="text-[13.5px] font-semibold text-(--ink-text)">{{ seasonMeta[cal.season].label }} {{ cal.year }}</div>
            </div>
            <span v-if="cal.id === calendar.board?.id" class="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
              style="background: rgba(94, 234, 212, 0.14); border: 1px solid rgba(94, 234, 212, 0.35); color: #5eead4">
              Atual
            </span>
            <span v-else class="text-[13px] text-(--ink-text-faint)">›</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
