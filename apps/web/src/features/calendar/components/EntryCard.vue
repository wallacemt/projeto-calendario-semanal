<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { CalendarEntryResponse } from '../api'
import { STATUS_META } from './entry-status-meta'

const props = defineProps<{ entry: CalendarEntryResponse }>()
defineEmits<{ remove: [] }>()

// totalEpisodes null = "em exibição" (ADR-06: episodes vem null do Jikan
// pra animes ainda em transmissão) — não dá pra calcular % nesse caso.
const ongoing = computed(() => props.entry.totalEpisodes == null)
const pct = computed(() => {
  if (ongoing.value) return 100
  const total = props.entry.totalEpisodes as number
  if (total <= 0) return 0
  return Math.min(100, Math.round((props.entry.currentEpisode / total) * 100))
})
const epLabel = computed(() =>
  ongoing.value
    ? `Ep. ${props.entry.currentEpisode} · em exibição`
    : `Ep. ${props.entry.currentEpisode}/${props.entry.totalEpisodes}`,
)
const meta = computed(() => STATUS_META[props.entry.status])
</script>

<template>
  <div
    class="group flex-shrink-0 overflow-hidden rounded-[13px] border"
    style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.035)"
  >
    <div class="relative h-18.5 bg-white/5">
      <img
        v-if="entry.anime.imageUrl"
        :src="entry.anime.imageUrl"
        :alt="entry.anime.title"
        class="h-full w-full object-cover"
      />
      <button
        type="button"
        title="Remover do calendário"
        class="absolute right-1.5 bottom-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-[5px] text-(--ink-text-muted) opacity-0 transition-opacity group-hover:opacity-100 hover:!bg-red-500/80 hover:!text-white"
        style="background: rgba(5, 6, 9, 0.75)"
        @click="$emit('remove')"
      >
        <X :size="11" />
      </button>
    </div>
    <div class="p-2.25 pb-2.75">
      <div class="mb-1.5 line-clamp-2 min-h-7.25 text-[11.5px] leading-tight font-bold text-(--ink-text)">
        {{ entry.anime.title }}
      </div>
      <div class="mb-1.25 text-[10px] text-(--ink-text-muted)">{{ epLabel }}</div>
      <div v-if="!ongoing" class="mb-2 h-1 overflow-hidden rounded-full" style="background: rgba(255, 255, 255, 0.07)">
        <div class="h-full" :style="{ width: `${pct}%`, background: meta.bar }" />
      </div>
      <div
        class="inline-flex rounded-full px-2 py-0.75 text-[9.5px] font-semibold"
        :style="{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }"
      >
        {{ meta.label }}
      </div>
    </div>
  </div>
</template>
