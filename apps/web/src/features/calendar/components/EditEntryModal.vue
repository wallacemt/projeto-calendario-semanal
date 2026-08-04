<script setup lang="ts">
import { ref } from 'vue'
import { EntryStatus, type UpdateAnimeInput, type UpdateEntryInput, type Weekday } from '@aniweek/shared'
import { X } from 'lucide-vue-next'
import AwSelect from '../../../components/AwSelect.vue'
import { HttpError } from '../../../lib/http'
import { useToastStore } from '../../../stores/toast'
import { calendarApi, type CalendarEntryResponse } from '../api'
import { useCalendarStore } from '../store'
import { STATUS_META } from './entry-status-meta'
import { WEEKDAY_META, WEEKDAY_ORDER } from '../weekday-meta'

const props = defineProps<{ entry: CalendarEntryResponse; weekday: Weekday }>()
const emit = defineEmits<{ close: [] }>()

const calendar = useCalendarStore()
const toast = useToastStore()

// Espelho do anime (M6, fora do blueprint) — todos os campos do form
// partem do que já está no board (nenhuma chamada extra pra popular o
// modal, ver EntryResponse.anime em calendar-board.type.ts).
const title = ref(props.entry.anime.title)
const imageUrl = ref(props.entry.anime.imageUrl ?? '')
const synopsis = ref(props.entry.anime.synopsis ?? '')
const episodesText = ref(props.entry.anime.episodes?.toString() ?? '')
const malUrl = ref(props.entry.anime.malUrl ?? '')
const linkAccess = ref(props.entry.anime.linkAccess ?? '')
const genresText = ref(props.entry.anime.genres.join(', '))

const weekdaySel = ref<Weekday>(props.weekday)
const currentEpisode = ref(props.entry.currentEpisode)
const totalEpisodesText = ref(props.entry.totalEpisodes?.toString() ?? '')
const status = ref(props.entry.status)

const saving = ref(false)

const weekdayOptions = WEEKDAY_ORDER.map((key) => ({ value: key, label: WEEKDAY_META[key].short }))
const statusOptions = Object.values(EntryStatus).map((s) => ({ value: s, label: STATUS_META[s].label }))

function toNullableInt(text: string): number | null {
  const trimmed = text.trim()
  return trimmed === '' ? null : Number(trimmed)
}

async function save() {
  saving.value = true
  try {
    const animePatch: UpdateAnimeInput = {}
    if (title.value !== props.entry.anime.title) animePatch.title = title.value
    const imageUrlValue = imageUrl.value.trim() || null
    if (imageUrlValue !== props.entry.anime.imageUrl) animePatch.imageUrl = imageUrlValue
    const synopsisValue = synopsis.value.trim() || null
    if (synopsisValue !== props.entry.anime.synopsis) animePatch.synopsis = synopsisValue
    const episodesValue = toNullableInt(episodesText.value)
    if (episodesValue !== props.entry.anime.episodes) animePatch.episodes = episodesValue
    const malUrlValue = malUrl.value.trim() || null
    if (malUrlValue !== props.entry.anime.malUrl) animePatch.malUrl = malUrlValue
    const linkAccessValue = linkAccess.value.trim() || null
    if (linkAccessValue !== props.entry.anime.linkAccess) animePatch.linkAccess = linkAccessValue
    const genresValue = genresText.value
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)
    if (genresValue.join(',') !== props.entry.anime.genres.join(',')) animePatch.genres = genresValue

    const entryPatch: UpdateEntryInput = {}
    if (weekdaySel.value !== props.weekday) entryPatch.weekday = weekdaySel.value
    if (currentEpisode.value !== props.entry.currentEpisode) entryPatch.currentEpisode = currentEpisode.value
    const totalEpisodesValue = toNullableInt(totalEpisodesText.value)
    if (totalEpisodesValue !== props.entry.totalEpisodes) entryPatch.totalEpisodes = totalEpisodesValue
    if (status.value !== props.entry.status) entryPatch.status = status.value

    if (Object.keys(animePatch).length > 0) {
      await calendarApi.updateAnime(props.entry.anime.id, animePatch)
      calendar.patchAnime(props.entry.id, animePatch)
    }
    if (Object.keys(entryPatch).length > 0) {
      await calendar.updateEntry(props.weekday, props.entry.id, entryPatch)
    }
    emit('close')
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao salvar edição')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" @click.self="emit('close')">
    <div
      class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)"
    >
      <div class="flex flex-shrink-0 items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="font-display text-[15px] font-bold text-(--ink-text)">Editar anime</div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form class="flex-1 space-y-4 overflow-y-auto p-4" @submit.prevent="save">
        <label class="block">
          <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Título</span>
          <input v-model="title" type="text" class="aw-input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Sinopse</span>
          <textarea v-model="synopsis" rows="3" class="aw-input resize-none" />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Imagem (URL)</span>
            <input v-model="imageUrl" type="text" class="aw-input" />
          </label>
          <label class="block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">MyAnimeList (URL)</span>
            <input v-model="malUrl" type="text" class="aw-input" />
          </label>
        </div>

        <label class="block">
          <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Gêneros (separados por vírgula)</span>
          <input v-model="genresText" type="text" class="aw-input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">
            Link de acesso <span class="text-(--ink-text-faint)">(onde você assiste — opcional)</span>
          </span>
          <input v-model="linkAccess" type="text" placeholder="https://..." class="aw-input" />
        </label>

        <div class="h-px" style="background: rgba(255, 255, 255, 0.08)" />

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Dia da semana</span>
            <AwSelect v-model="weekdaySel" :options="weekdayOptions" />
          </label>
          <label class="block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Status</span>
            <AwSelect v-model="status" :options="statusOptions" />
          </label>
          <label class="block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Episódio atual</span>
            <input v-model.number="currentEpisode" type="number" min="0" class="aw-input" />
          </label>
          <label class="block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Total de episódios</span>
            <input v-model="totalEpisodesText" type="number" min="1" placeholder="Em exibição" class="aw-input" />
          </label>
          <label class="col-span-2 block">
            <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Episódios conhecidos (Anime)</span>
            <input v-model="episodesText" type="number" min="1" placeholder="Ex.: 24" class="aw-input" />
          </label>
        </div>
      </form>

      <div class="flex flex-shrink-0 justify-end gap-2.5 border-t p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-[13px] font-semibold text-(--ink-text-muted) hover:text-(--ink-text)"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)"
          @click="save"
        >
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aw-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.55rem 0.75rem;
  font-size: 13px;
  color: var(--ink-text);
  outline: none;
}
.aw-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
}
</style>
