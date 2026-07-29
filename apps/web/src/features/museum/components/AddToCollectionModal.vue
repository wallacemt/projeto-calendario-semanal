<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AnimeDto, Season } from '@aniweek/shared'
import { Search, X } from 'lucide-vue-next'
import { useDebounce } from '../../../composables/useDebounce'
import RatingStars from '../../../components/RatingStars.vue'
import { discoverApi } from '../../discover/api'
import SeasonYearFields from './SeasonYearFields.vue'
import { useMuseumStore } from '../store'

const emit = defineEmits<{ close: [] }>()
const museum = useMuseumStore()

// Mesmo padrão do AddEntryModal (calendário): busca via Jikan, nunca um
// título livre — WatchedAnime.animeId sempre aponta pro espelho local.
const query = ref('')
const debouncedQuery = useDebounce(query, 400)
const results = ref<AnimeDto[]>([])
const loading = ref(false)

const selected = ref<AnimeDto | null>(null)
const rating = ref(8)
const comment = ref('')
const watchedSeason = ref<Season | null>(null)
const watchedYear = ref<number | null>(null)

watch(debouncedQuery, async (value) => {
  if (!value.trim()) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await discoverApi.search(value, 1, 'all')
    results.value = data
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!selected.value) return
  const created = await museum.add({
    malId: selected.value.malId,
    rating: rating.value,
    comment: comment.value.trim() || undefined,
    watchedSeason: watchedSeason.value ?? undefined,
    watchedYear: watchedYear.value ?? undefined,
  })
  if (created) emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-24" @click.self="emit('close')">
    <div class="flex max-h-[70vh] w-full max-w-125 flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
      <div class="flex items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="font-display text-[15px] font-bold text-(--ink-text)">Adicionar à coleção</div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <!-- Passo 1: buscar e escolher o anime -->
      <template v-if="!selected">
        <div class="flex-shrink-0 p-4 pb-2">
          <div class="flex h-10.5 items-center gap-2.5 rounded-xl border px-3.5"
            style="border-color: rgba(139, 92, 246, 0.35); background: rgba(255, 255, 255, 0.04)">
            <Search :size="15" class="text-(--ink-text-muted)" />
            <input v-model="query" type="text" autofocus placeholder="Buscar anime pelo título..."
              class="flex-1 bg-transparent text-[13.5px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)" />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <p v-if="loading" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">Buscando...</p>
          <p v-else-if="!query.trim()" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">
            Digite pra buscar um anime já concluído.
          </p>
          <p v-else-if="results.length === 0" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">
            Nenhum resultado para "{{ query }}".
          </p>
          <button v-for="anime in results" :key="anime.malId" type="button"
            class="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5" @click="selected = anime">
            <div class="h-14 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
              <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.title" class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-1 text-[13px] font-semibold text-(--ink-text)">{{ anime.title }}</div>
              <div class="text-[11px] text-(--ink-text-faint)">
                {{ [anime.type, anime.episodes ? `${anime.episodes} eps` : null].filter(Boolean).join(' · ') }}
              </div>
            </div>
          </button>
        </div>
      </template>

      <!-- Passo 2: nota + comentário -->
      <template v-else>
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div class="flex items-center gap-3">
            <div class="h-16 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
              <img v-if="selected.imageUrl" :src="selected.imageUrl" :alt="selected.title"
                class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0">
              <div class="line-clamp-2 text-[13.5px] font-semibold text-(--ink-text)">{{ selected.title }}</div>
              <button type="button" class="text-[11.5px] text-(--brand-secondary) hover:underline"
                @click="selected = null">Trocar anime</button>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-[12px] text-(--ink-text-muted)">Sua nota</label>
            <RatingStars v-model="rating" />
          </div>

          <div>
            <label class="mb-1.5 block text-[12px] text-(--ink-text-muted)">Nota pessoal (opcional)</label>
            <textarea v-model="comment" placeholder="O que essa obra significou pra você?"
              class="h-20 w-full resize-none rounded-[10px] border px-3.5 py-2.5 text-[13px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)"
              style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)" />
          </div>

          <SeasonYearFields v-model:season="watchedSeason" v-model:year="watchedYear" />
        </div>

        <div class="flex justify-end gap-3 border-t p-4" style="border-color: rgba(255, 255, 255, 0.06)">
          <button type="button" class="h-10.5 rounded-[10px] border px-4.5 text-[13px] text-(--ink-text-muted)"
            style="border-color: rgba(255, 255, 255, 0.1)" @click="emit('close')">Cancelar</button>
          <button type="button" :disabled="museum.saving"
            class="h-10.5 rounded-[10px] px-5 text-[13px] font-bold text-white disabled:opacity-50"
            style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)" @click="save">
            Adicionar ao museu
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
