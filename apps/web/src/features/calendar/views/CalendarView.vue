<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Weekday } from '@aniweek/shared'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
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

// Accordion (atualização de design): só um dia fica expandido por vez, os
// outros colapsam numa faixa estreita — abre em "hoje" por padrão pra não
// obrigar o usuário a caçar o dia certo entre 8 colunas.
function todayKey(): Weekday {
  const day = new Date().getDay() // 0=dom..6=sáb
  return DAY_DEFS[day === 0 ? 6 : day].key
}
const expandedDay = ref<Weekday>(todayKey())

const days = computed(() =>
  DAY_DEFS.map((d, i) => ({
    ...d,
    date: d.isExtra ? 'Backlog' : weekDates[i],
    entries: calendar.board?.entries[d.key] ?? [],
    isExpanded: d.key === expandedDay.value,
  })),
)

const totalEntries = computed(() => days.value.reduce((sum, d) => sum + d.entries.length, 0))

const addModalWeekday = ref<Weekday | null>(null)
const addModalLabel = ref('')
function openAddModal(weekday: Weekday, label: string) {
  addModalWeekday.value = weekday
  addModalLabel.value = label
}

// M5/AC-05: VueDraggablePlus (SortableJS) já move o card entre os arrays via
// v-model — o @end só precisa persistir onde ele parou. group="board"
// compartilhado entre as 8 colunas (7 dias + backlog) é o que permite soltar
// num dia diferente do de origem, não só reordenar dentro do mesmo dia.
function onDragEnd(evt: DraggableEvent) {
  const entryId = evt.item.dataset.entryId
  const toWeekday = evt.to.dataset.weekday as Weekday | undefined
  if (!entryId || !toWeekday || evt.newIndex == null) return
  calendar.moveEntry(entryId, toWeekday, evt.newIndex)
}
</script>

<template>
  <AppShell title="Calendário Semanal" :subtitle="`${totalEntries} animes na semana`">
    <div class="flex h-full flex-col">
      <p v-if="calendar.loading" class="p-8 text-sm text-(--ink-text-faint)">Carregando calendário...</p>
      <p v-else-if="calendar.error" class="p-8 text-sm text-(--ink-error)">{{ calendar.error }}</p>

      <div v-else class="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-6">
        <div v-for="day in days" :key="day.key" class="relative flex  flex-col overflow-hidden rounded-[14px]" :style="{
          flex: day.isExpanded ? '4 1 420px' : '0 0 4.5rem',
          minWidth: day.isExpanded ? '340px' : '4.5rem',
          cursor: day.isExpanded ? 'default' : 'pointer',
          transition:
            'flex-grow .45s cubic-bezier(.4,0,.2,1), flex-basis .45s cubic-bezier(.4,0,.2,1), min-width .45s cubic-bezier(.4,0,.2,1)',
        }" @click="!day.isExpanded && (expandedDay = day.key)">
          <!-- Expandido: dia atual (ou o último clicado) -->
          <div v-if="day.isExpanded"
            class="group flex h-full flex-col gap-2.5 overflow-auto max-h-full rounded-[14px]  p-3.5">
            <div class="flex  items-center justify-between px-0.5">
              <div>
                <div class="font-mono text-[11px] font-bold tracking-wide"
                  :style="{ color: day.isExtra ? '#FBBF24' : '#B4B8C6' }">
                  {{ day.short }}
                </div>
                <div class="mt-0.5 text-[10px] text-(--ink-text-faint)">{{ day.date }}</div>
              </div>
              <div
                class="flex h-5 w-5 items-center justify-center rounded-md text-[10.5px] font-bold text-(--ink-text-muted)"
                style="background: rgba(255, 255, 255, 0.06)">
                {{ day.entries.length }}
              </div>
            </div>

            <!-- group="board" compartilhado com as outras 7 colunas (M5/AC-05):
                 é isso que deixa soltar um card num dia diferente do de origem. -->
            <VueDraggable v-if="calendar.board" v-model="calendar.board.entries[day.key]" :group="{ name: 'board', pull: true, put: true }"
              tag="div" class="grid  flex-1 grid-cols-4 content-start gap-2.5 pb-1 " :data-weekday="day.key"
              @end="onDragEnd">
              <EntryCard v-for="entry in calendar.board!.entries[day.key]" :key="entry.id" :data-entry-id="entry.id"
                :entry="entry" @remove="calendar.removeEntry(day.key, entry.id)"
                @progress="calendar.updateProgress(day.key, entry.id, $event)" />
            </VueDraggable>

            <button type="button"
              class="h-9.5 flex-shrink-0 rounded-[10px] border border-dashed text-[11px] text-(--ink-text-faint) opacity-0 transition-opacity group-hover:opacity-100 hover:border-(--brand-secondary)/40 hover:text-(--brand-secondary)"
              style="border-color: rgba(255, 255, 255, 0.15)"
              @click="openAddModal(day.key, `${day.short}${day.isExtra ? '' : ` · ${day.date}`}`)">
              + Adicionar
            </button>
          </div>

          <!-- Colapsado: só a faixa com contagem + label vertical, clique expande -->
          <div v-else
            class="flex h-full flex-col items-center gap-3.5 rounded-[14px] border py-4 hover:border-(--brand-secondary)/35 hover:bg-(--brand-secondary)/8"
            style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.02)">
            <div
              class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-(--ink-text-muted)"
              style="background: rgba(255, 255, 255, 0.06)">
              {{ day.entries.length }}
            </div>
            <div class="font-mono text-[11.5px] font-bold tracking-wider whitespace-nowrap"
              :style="{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: day.isExtra ? '#FBBF24' : '#B4B8C6' }">
              {{ day.short }} · {{ day.date }}
            </div>
          </div>

          <!-- Overlay invisível: aceita drop mesmo colapsado (mesmo group das
               colunas expandidas). Itens 0x0 só pra manter DOM em sincronia
               1:1 com o array (o que o Sortable usa pra calcular índice). -->
          <VueDraggable v-if="!day.isExpanded && calendar.board" v-model="calendar.board.entries[day.key]"
            :group="{ name: 'board', pull: true, put: true }" tag="div" class="absolute inset-0 opacity-0"
            :data-weekday="day.key" @end="onDragEnd">
            <div v-for="entry in calendar.board!.entries[day.key]" :key="entry.id" :data-entry-id="entry.id"
              class="h-0 w-0 overflow-hidden" />
          </VueDraggable>
        </div>
      </div>
    </div>

    <AddEntryModal v-if="addModalWeekday" :weekday="addModalWeekday" :weekday-label="addModalLabel"
      @close="addModalWeekday = null" />
  </AppShell>
</template>
