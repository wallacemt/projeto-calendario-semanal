<script setup lang="ts">
import { ref } from 'vue'
import type { Season, UpdateWatchedAnimeInput } from '@aniweek/shared'
import { X } from 'lucide-vue-next'
import RatingStars from '../../../components/RatingStars.vue'
import SeasonYearFields from './SeasonYearFields.vue'
import { useMuseumStore } from '../store'
import type { WatchedAnimeDto } from '../api'

const props = defineProps<{ entry: WatchedAnimeDto }>()
const emit = defineEmits<{ close: [] }>()

const museum = useMuseumStore()

const rating = ref(props.entry.rating ?? 0)
const comment = ref(props.entry.comment ?? '')
const completedAtText = ref(props.entry.completedAt.slice(0, 10))
const watchedSeason = ref<Season | null>(props.entry.watchedSeason)
const watchedYear = ref<number | null>(props.entry.watchedYear)
const saving = ref(false)

// Mesmo padrão do EditEntryModal (calendário): monta o PATCH só com o que
// mudou — updateWatchedAnimeSchema rejeita objeto vazio (refine), então um
// "Salvar" sem alterar nada precisa fechar sem chamar a API, não mandar {}.
async function save() {
  saving.value = true
  try {
    const patch: UpdateWatchedAnimeInput = {}
    const ratingValue = rating.value > 0 ? rating.value : null
    if (ratingValue !== props.entry.rating) patch.rating = ratingValue
    const commentValue = comment.value.trim() || null
    if (commentValue !== props.entry.comment) patch.comment = commentValue
    if (completedAtText.value !== props.entry.completedAt.slice(0, 10)) {
      patch.completedAt = new Date(completedAtText.value)
    }
    if (watchedSeason.value !== props.entry.watchedSeason) patch.watchedSeason = watchedSeason.value
    if (watchedYear.value !== props.entry.watchedYear) patch.watchedYear = watchedYear.value

    if (Object.keys(patch).length === 0) {
      emit('close')
      return
    }
    const ok = await museum.update(props.entry.id, patch)
    if (ok) emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" @click.self="emit('close')">
    <div class="w-full max-w-105 rounded-2xl border p-6" style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
      <div class="mb-1 flex items-start justify-between">
        <div class="font-display text-[16px] font-bold text-(--ink-text)">Editar registro</div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <p class="mb-5 text-[12.5px] text-(--ink-text-faint)">{{ entry.anime.title }}</p>

      <div class="mb-1.5 flex items-center justify-between">
        <label class="block text-[12px] text-(--ink-text-muted)">Sua nota</label>
        <button type="button" class="text-[11px] text-(--brand-secondary) hover:underline" @click="rating = 0">
          Sem nota
        </button>
      </div>
      <RatingStars v-model="rating" />

      <label class="mt-4 mb-1.5 block text-[12px] text-(--ink-text-muted)">Nota pessoal (opcional)</label>
      <textarea v-model="comment" placeholder="O que essa obra significou pra você?"
        class="h-20 w-full resize-none rounded-[10px] border px-3.5 py-2.5 text-[13px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)"
        style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)" />

      <label class="mt-4 mb-1.5 block text-[12px] text-(--ink-text-muted)">Data em que assistiu</label>
      <input v-model="completedAtText" type="date"
        class="mb-4 h-10.5 w-full rounded-[10px] border px-3.5 text-[13px] text-(--ink-text) outline-none"
        style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)" />

      <SeasonYearFields v-model:season="watchedSeason" v-model:year="watchedYear" />

      <div class="mt-5 flex justify-end gap-3">
        <button type="button" class="h-10.5 rounded-[10px] border px-4.5 text-[13px] text-(--ink-text-muted)"
          style="border-color: rgba(255, 255, 255, 0.1)" @click="emit('close')">Cancelar</button>
        <button type="button" :disabled="saving"
          class="h-10.5 rounded-[10px] px-5 text-[13px] font-bold text-white disabled:opacity-50"
          style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)" @click="save">
          Salvar
        </button>
      </div>
    </div>
  </div>
</template>
