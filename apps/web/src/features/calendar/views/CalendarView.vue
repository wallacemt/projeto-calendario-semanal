<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Weekday } from '@aniweek/shared'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { Plus, RotateCcw } from 'lucide-vue-next'
import AppShell from '../../../components/AppShell.vue'
import { seasonMeta } from '../../../lib/season-meta'
import AddEntryModal from '../components/AddEntryModal.vue'
import BringForwardModal from '../components/BringForwardModal.vue'
import CalendarBoardSkeleton from '../components/CalendarBoardSkeleton.vue'
import EditEntryModal from '../components/EditEntryModal.vue'
import EntryCard from '../components/EntryCard.vue'
import EntryContextMenu from '../components/EntryContextMenu.vue'
import NewSeasonModal from '../components/NewSeasonModal.vue'
import type { CalendarEntryResponse } from '../api'
import { useCalendarStore } from '../store'
import { WEEKDAY_META, WEEKDAY_ORDER } from '../weekday-meta'
import { router } from '../../../router/index.ts'

const calendar = useCalendarStore()
onMounted(() => calendar.load())

// Ordem fixa do board (RF-04): 7 dias + BACKLOG (aba "extra" do legado —
// ADR-08). Sem dependência nova: datas da semana calculadas com Date nativo,
// não precisa de date-fns só pra formatar "21 Jul" no front (date-fns já é
// usado no backend, aqui é 1 função pequena).
const DAY_DEFS = WEEKDAY_ORDER.map((key) => ({ key, ...WEEKDAY_META[key] }))

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

const bringForwardOpen = ref(false)
const newSeasonOpen = ref(false)

// M6 (fora do blueprint): menu de contexto do right-click + modal de editar.
const contextMenu = ref<{ x: number; y: number; entry: CalendarEntryResponse; weekday: Weekday } | null>(null)
function onCardContextMenu(event: MouseEvent, entry: CalendarEntryResponse, weekday: Weekday) {
  contextMenu.value = { x: event.clientX, y: event.clientY, entry, weekday }
}
const editingEntry = ref<{ entry: CalendarEntryResponse; weekday: Weekday } | null>(null)
function openEdit() {
  if (!contextMenu.value) return
  editingEntry.value = { entry: contextMenu.value.entry, weekday: contextMenu.value.weekday }
  contextMenu.value = null
}
function removeFromMenu() {
  if (!contextMenu.value) return
  calendar.removeEntry(contextMenu.value.weekday, contextMenu.value.entry.id)
  contextMenu.value = null
}

function viewAnimeDetails() {
  if (!contextMenu.value) return
  router.push(`/discover/${contextMenu.value.entry.anime.malId}`)
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
      <CalendarBoardSkeleton v-if="calendar.loading" />
      <p v-else-if="calendar.error" class="p-8 text-sm text-(--ink-error)">{{ calendar.error }}</p>

      <template v-else>
        <!-- M6 (fora do blueprint): navegação/import de temporada. Em telas
             estreitas os rótulos somem (só ícone/emoji + title) pra caber os
             3 botões numa linha sem quebrar feio — flex-wrap como rede de
             segurança se ainda assim não couber. -->
        <div v-if="calendar.board"
          class="glass glass-strong flex flex-shrink-0 flex-wrap items-center justify-end gap-1.5 rounded-none border-x-0 border-t-0 px-3 py-2.5 sm:gap-2.5 sm:px-6 sm:py-3">
          <button type="button" title="Trazer temporada anterior"
            class="glass flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12.5px] text-(--ink-text) sm:px-3.5"
            @click="bringForwardOpen = true">
            {{ seasonMeta[calendar.board.season].emoji }}
            <span class="hidden sm:inline">{{ seasonMeta[calendar.board.season].label }} · {{ calendar.board.year
            }}</span>
            <span class="text-(--ink-text-faint)">▾</span>
          </button>
          <button type="button" title="Importar da temporada anterior"
            class="glass flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-[12.5px]"
            style="border-color: rgba(139, 92, 246, 0.35); color: #c4b5fd"
            @click="calendar.importPreviousBulk()">
            <RotateCcw :size="13" /> <span class="hidden sm:inline">Importar da temporada anterior</span>
          </button>
          <button type="button" title="Nova temporada"
            class="glass flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-[12.5px] text-(--ink-text) sm:px-3.5"
            @click="newSeasonOpen = true">
            <Plus :size="13" /> <span class="hidden sm:inline">Nova temporada</span>
          </button>
        </div>

        <div class="flex flex-1 gap-2 overflow-x-auto overflow-y-hidden p-3 sm:gap-3 sm:p-6">
          <div v-for="day in days" :key="day.key" class="relative flex  flex-col overflow-hidden rounded-[14px]" :style="{
            flex: day.isExpanded ? '4 1 clamp(260px, 88vw, 420px)' : '0 0 clamp(2.75rem, 8vw, 4.5rem)',
            minWidth: day.isExpanded ? 'min(340px, 88vw)' : 'clamp(2.75rem, 8vw, 4.5rem)',
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
              <VueDraggable v-if="calendar.board" v-model="calendar.board.entries[day.key]"
                :group="{ name: 'board', pull: true, put: true }" tag="div"
                class="grid flex-1 grid-cols-2 content-start gap-2.5 pb-1 sm:grid-cols-3 lg:grid-cols-4"
                :data-weekday="day.key" @end="onDragEnd">
                <EntryCard v-for="entry in calendar.board!.entries[day.key]" :key="entry.id" :data-entry-id="entry.id"
                  :entry="entry" @remove="calendar.removeEntry(day.key, entry.id)"
                  @progress="calendar.updateProgress(day.key, entry.id, $event)"
                  @contextmenu="onCardContextMenu($event, entry, day.key)" />
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
              class="glass flex h-full flex-col items-center gap-3.5 rounded-[14px] py-4 hover:border-(--brand-secondary)/35 hover:bg-(--brand-secondary)/8">
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
      </template>
    </div>

    <AddEntryModal v-if="addModalWeekday" :weekday="addModalWeekday" :weekday-label="addModalLabel"
      @close="addModalWeekday = null" />

    <BringForwardModal v-if="bringForwardOpen" @close="bringForwardOpen = false" />

    <NewSeasonModal v-if="newSeasonOpen" @close="newSeasonOpen = false" />

    <EntryContextMenu v-if="contextMenu" :x="contextMenu.x" :y="contextMenu.y" @edit="openEdit" @remove="removeFromMenu"
      @view_details="viewAnimeDetails" @close="contextMenu = null" />

    <EditEntryModal v-if="editingEntry" :entry="editingEntry.entry" :weekday="editingEntry.weekday"
      @close="editingEntry = null" />
  </AppShell>
</template>
