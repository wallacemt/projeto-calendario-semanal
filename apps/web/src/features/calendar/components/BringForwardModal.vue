<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Season, type Weekday } from '@aniweek/shared'
import { ArrowLeft, X } from 'lucide-vue-next'
import { HttpError } from '../../../lib/http'
import { seasonMeta } from '../../../lib/season-meta'
import { useToastStore } from '../../../stores/toast'
import { calendarApi, type CalendarEntryResponse, type CalendarSummary } from '../api'
import { useCalendarStore } from '../store'
import { WEEKDAY_META, WEEKDAY_ORDER } from '../weekday-meta'

const emit = defineEmits<{ close: [] }>()

const calendar = useCalendarStore()
const toast = useToastStore()

// Drill-down manual por QUALQUER temporada passada (diferente do bulk
// import-previous — ver botão "Importar da temporada anterior" na topbar,
// que chama calendar.importPreviousBulk() direto, sem esse modal).
type View = 'years' | 'seasons' | 'animes'
const view = ref<View>('years')

const calendars = ref<CalendarSummary[]>([])
const loadingCalendars = ref(true)

const selectedYear = ref<number | null>(null)
const selectedCalendar = ref<CalendarSummary | null>(null)
const browseAnimes = ref<CalendarEntryResponse[]>([])
const loadingAnimes = ref(false)

const addingWeekdayFor = ref<string | null>(null)
const addedMalIds = ref(new Set<number>())

onMounted(async () => {
  try {
    calendars.value = await calendarApi.list()
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao carregar temporadas')
  } finally {
    loadingCalendars.value = false
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

async function openSeason(cal: CalendarSummary) {
  if (cal.id === calendar.board?.id) return // não faz sentido "trazer" do próprio board atual
  selectedCalendar.value = cal
  view.value = 'animes'
  loadingAnimes.value = true
  try {
    const board = await calendarApi.getOne(cal.id)
    browseAnimes.value = Object.values(board.entries).flat()
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao carregar animes da temporada')
  } finally {
    loadingAnimes.value = false
  }
}

function back() {
  if (view.value === 'animes') view.value = 'seasons'
  else if (view.value === 'seasons') view.value = 'years'
}

async function bringAnime(entry: CalendarEntryResponse, weekday: Weekday) {
  try {
    await calendar.addEntry(weekday, entry.anime.malId)
    addedMalIds.value.add(entry.anime.malId)
    toast.push(`${entry.anime.title} adicionado a ${WEEKDAY_META[weekday].short}`)
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao trazer anime')
  } finally {
    addingWeekdayFor.value = null
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" @click.self="emit('close')">
    <div
      class="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)"
    >
      <div class="flex flex-shrink-0 items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="flex items-center gap-3">
          <button
            v-if="view !== 'years'"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border text-(--ink-text-muted) hover:text-(--ink-text)"
            style="border-color: rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.04)"
            @click="back"
          >
            <ArrowLeft :size="14" />
          </button>
          <div>
            <div class="font-display text-[15px] font-bold text-(--ink-text)">
              <template v-if="view === 'years'">Trazer de temporada anterior</template>
              <template v-else-if="view === 'seasons'">{{ selectedYear }}</template>
              <template v-else>{{ seasonMeta[selectedCalendar!.season].emoji }} {{ seasonMeta[selectedCalendar!.season].label }} {{ selectedCalendar!.year }}</template>
            </div>
            <div class="mt-0.5 text-[11.5px] text-(--ink-text-faint)">
              <template v-if="view === 'years'">Escolha o ano</template>
              <template v-else-if="view === 'seasons'">Escolha a temporada</template>
              <template v-else>Escolha um anime e o dia da semana pra trazer pro board atual</template>
            </div>
          </div>
        </div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <p v-if="loadingCalendars" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">Carregando...</p>

        <!-- Anos em cards -->
        <div v-else-if="view === 'years'" class="grid grid-cols-3 gap-3">
          <p v-if="years.length === 0" class="col-span-3 py-8 text-center text-[12.5px] text-(--ink-text-faint)">
            Nenhuma temporada ainda.
          </p>
          <button
            v-for="y in years"
            :key="y.year"
            type="button"
            class="flex flex-col items-start gap-1 rounded-xl border p-4 text-left hover:border-(--brand-secondary)/40"
            style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03)"
            @click="openYear(y.year)"
          >
            <div class="font-mono text-[20px] font-bold text-(--ink-text)">{{ y.year }}</div>
            <div class="text-[11px] text-(--ink-text-faint)">{{ y.count }} temporada(s)</div>
          </button>
        </div>

        <!-- Estações do ano escolhido -->
        <div v-else-if="view === 'seasons'" class="flex flex-col gap-2">
          <div
            v-for="cal in seasonsOfSelectedYear"
            :key="cal.id"
            class="flex items-center justify-between rounded-xl border p-3.5"
            :class="cal.id === calendar.board?.id ? 'opacity-60' : 'cursor-pointer hover:border-(--brand-secondary)/40'"
            style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03)"
            @click="openSeason(cal)"
          >
            <div class="flex items-center gap-3">
              <span class="text-[18px]">{{ seasonMeta[cal.season].emoji }}</span>
              <div class="text-[13.5px] font-semibold text-(--ink-text)">{{ seasonMeta[cal.season].label }} {{ cal.year }}</div>
            </div>
            <span
              v-if="cal.id === calendar.board?.id"
              class="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
              style="background: rgba(94, 234, 212, 0.14); border: 1px solid rgba(94, 234, 212, 0.35); color: #5eead4"
            >
              Atual
            </span>
            <span v-else class="text-[13px] text-(--ink-text-faint)">›</span>
          </div>
        </div>

        <!-- Animes da temporada escolhida -->
        <div v-else>
          <p v-if="loadingAnimes" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">Carregando...</p>
          <p v-else-if="browseAnimes.length === 0" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">
            Nenhum anime nessa temporada.
          </p>
          <div v-else class="grid grid-cols-4 gap-3.5">
            <div
              v-for="entry in browseAnimes"
              :key="entry.id"
              class="overflow-hidden rounded-xl border"
              style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03)"
            >
              <div class="aspect-[2/3] bg-white/5">
                <img v-if="entry.anime.imageUrl" :src="entry.anime.imageUrl" :alt="entry.anime.title" class="h-full w-full object-cover" />
              </div>
              <div class="p-2.5">
                <div class="mb-2 line-clamp-2 min-h-8 text-[12px] font-bold text-(--ink-text)">{{ entry.anime.title }}</div>

                <div v-if="addedMalIds.has(entry.anime.malId)" class="rounded-lg py-1.5 text-center text-[11px] font-semibold" style="background: rgba(94, 234, 212, 0.12); color: #5eead4">
                  ✓ Trazido
                </div>
                <div v-else-if="addingWeekdayFor === entry.id" class="grid grid-cols-4 gap-1">
                  <button
                    v-for="key in WEEKDAY_ORDER"
                    :key="key"
                    type="button"
                    class="rounded-md py-1 text-[9.5px] font-bold text-(--ink-text-muted) hover:bg-white/10 hover:text-(--ink-text)"
                    style="background: rgba(255, 255, 255, 0.06)"
                    @click="bringAnime(entry, key)"
                  >
                    {{ WEEKDAY_META[key].short }}
                  </button>
                </div>
                <button
                  v-else
                  type="button"
                  class="w-full rounded-lg py-1.5 text-[11px] font-bold"
                  style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.35); color: #c4b5fd"
                  @click="addingWeekdayFor = entry.id"
                >
                  + Trazer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
