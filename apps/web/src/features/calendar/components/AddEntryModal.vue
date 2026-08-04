<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AnimeDto, Weekday } from '@aniweek/shared'
import { Search, X } from 'lucide-vue-next'
import { useDebounce } from '../../../composables/useDebounce'
import { HttpError } from '../../../lib/http'
import { useToastStore } from '../../../stores/toast'
import { discoverApi } from '../../discover/api'
import { useCalendarStore } from '../store'

const props = defineProps<{ weekday: Weekday; weekdayLabel: string }>()
const emit = defineEmits<{ close: [] }>()

const calendar = useCalendarStore()
const toast = useToastStore()

const query = ref('')
const debouncedQuery = useDebounce(query, 400)
const results = ref<AnimeDto[]>([])
const loading = ref(false)
// malId em voo (não um bool global) — permite desabilitar só o botão
// clicado, os outros resultados continuam clicáveis enquanto essa requisição roda.
const addingMalId = ref<number | null>(null)

watch(debouncedQuery, async (value) => {
  if (!value.trim()) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await discoverApi.search(value, 1, 'all')
    results.value = data
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao buscar animes')
  } finally {
    loading.value = false
  }
})

async function addAnime(anime: AnimeDto) {
  addingMalId.value = anime.malId
  try {
    await calendar.addEntry(props.weekday, anime.malId)
    emit('close')
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao adicionar anime')
  } finally {
    addingMalId.value = null
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-24" @click.self="emit('close')">
    <div
      class="flex max-h-[70vh] w-full max-w-125 flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)"
    >
      <div class="flex items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="font-display text-[15px] font-bold text-(--ink-text)">
          Adicionar a {{ weekdayLabel }}
        </div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-shrink-0 p-4 pb-2">
        <div
          class="flex h-10.5 items-center gap-2.5 rounded-xl border px-3.5"
          style="border-color: rgba(139, 92, 246, 0.35); background: rgba(255, 255, 255, 0.04)"
        >
          <Search :size="15" class="text-(--ink-text-muted)" />
          <input
            v-model="query"
            type="text"
            autofocus
            placeholder="Buscar anime pelo título..."
            class="flex-1 bg-transparent text-[13.5px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <p v-if="loading" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">Buscando...</p>
        <p v-else-if="!query.trim()" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">
          Digite pra buscar um anime.
        </p>
        <p v-else-if="results.length === 0" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">
          Nenhum resultado para "{{ query }}".
        </p>
        <button
          v-for="anime in results"
          :key="anime.malId"
          type="button"
          :disabled="addingMalId !== null"
          class="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5 disabled:opacity-50"
          @click="addAnime(anime)"
        >
          <div class="h-14 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
            <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.title" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="line-clamp-1 text-[13px] font-semibold text-(--ink-text)">{{ anime.title }}</div>
            <div class="text-[11px] text-(--ink-text-faint)">
              {{ [anime.type, anime.episodes ? `${anime.episodes} eps` : null].filter(Boolean).join(' · ') }}
            </div>
          </div>
          <span v-if="addingMalId === anime.malId" class="text-[11px] text-(--ink-text-faint)">Adicionando...</span>
        </button>
      </div>
    </div>
  </div>
</template>
