<script setup lang="ts">
import { ref } from 'vue'
import { Maximize2, Minimize2, SquareArrowOutUpRight, X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { AnimeDto } from '@aniweek/shared'

defineProps<{ anime: AnimeDto }>()
defineEmits<{ close: [] }>()

// Estado só do painel (não vai pra store): cada vez que o painel reabre pra
// outro anime ele é recriado via v-if no pai, então o ref já volta pro
// default sozinho — não precisa de reset manual.
const expanded = ref(false)

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Extra']
</script>

<template>
  <div
    class="absolute inset-y-0 right-0 z-20 flex flex-col overflow-y-auto border-l transition-[width] duration-300 ease-out"
    :class="expanded ? 'w-full' : 'w-105'"
    style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.08); box-shadow: -24px 0 48px -16px rgba(0, 0, 0, 0.55)"
  >
    <div class="relative h-65 flex-shrink-0 bg-white/5">
      <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.title" class="h-full w-full object-cover" />
      <div class="absolute inset-0" style="background: linear-gradient(180deg, transparent 40%, #0a0b12 100%)" />
      <div class="absolute top-4 right-4 flex gap-2">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-[9px] border"
          style="background: rgba(5, 6, 9, 0.6); border-color: rgba(255, 255, 255, 0.1)"
          :title="expanded ? 'Recolher' : 'Expandir'"
          @click="expanded = !expanded"
        >
          <Minimize2 v-if="expanded" :size="15" />
          <Maximize2 v-else :size="15" />
        </button>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-[9px] border"
          style="background: rgba(5, 6, 9, 0.6); border-color: rgba(255, 255, 255, 0.1)"
          title="Fechar"
          @click="$emit('close')"
        >
          <X :size="15" />
        </button>
      </div>
      <div class="absolute right-5 bottom-4 left-5">
        <div class="font-display text-[21px] leading-tight font-extrabold text-white">{{ anime.title }}</div>
        <div v-if="anime.type || anime.year" class="mt-1 text-[12px] text-(--ink-text-faint)">
          {{ [anime.type, anime.year].filter(Boolean).join(' · ') }}
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5 p-6" :class="expanded ? 'mx-auto w-full max-w-2xl' : ''">
      <div class="flex gap-2.5">
        <div
          class="flex-1 rounded-xl border p-3 text-center"
          style="background: rgba(255, 255, 255, 0.035); border-color: rgba(255, 255, 255, 0.08)"
        >
          <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">Nota</div>
          <div class="font-display text-[17px] font-extrabold" style="color: #fbbf24">
            ★ {{ anime.score?.toFixed(1) ?? '—' }}
          </div>
        </div>
        <div
          class="flex-1 rounded-xl border p-3 text-center"
          style="background: rgba(255, 255, 255, 0.035); border-color: rgba(255, 255, 255, 0.08)"
        >
          <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">Episódios</div>
          <div class="font-display text-[17px] font-extrabold text-white">{{ anime.episodes ?? '—' }}</div>
        </div>
        <div
          class="flex-1 rounded-xl border p-3 text-center"
          style="background: rgba(255, 255, 255, 0.035); border-color: rgba(255, 255, 255, 0.08)"
        >
          <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">Status</div>
          <div class="font-display text-[13px] font-bold" style="color: #5eead4">{{ anime.status ?? '—' }}</div>
        </div>
      </div>

      <RouterLink
        :to="{ name: 'anime-detail', params: { malId: anime.malId } }"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold text-white"
        style="border-color: rgba(139, 92, 246, 0.4); background: rgba(139, 92, 246, 0.12)"
      >
        Ver detalhes completos
        <SquareArrowOutUpRight :size="14" />
      </RouterLink>

      <div v-if="anime.genres.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="genre in anime.genres"
          :key="genre"
          class="rounded-full border px-2.75 py-1 text-[11px]"
          style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); color: #c4b5fd"
        >
          {{ genre }}
        </span>
      </div>

      <div v-if="anime.synopsis">
        <div class="mb-2 text-[13px] font-bold text-white">Sinopse</div>
        <p class="text-[12.5px] leading-relaxed text-(--ink-text-muted)">{{ anime.synopsis }}</p>
      </div>

      <div>
        <div class="mb-2.5 text-[13px] font-bold text-white">Adicionar ao calendário</div>
        <div class="mb-3.5 grid grid-cols-4 gap-2">
          <div
            v-for="day in WEEKDAYS"
            :key="day"
            class="rounded-[9px] border py-2.25 text-center text-xs text-(--ink-text-faint)"
            style="border-color: rgba(255, 255, 255, 0.1)"
          >
            {{ day }}
          </div>
        </div>
        <!-- Calendar/CalendarEntry chegam na M4 (ADR-03) — sem onde persistir
             a escolha ainda, então o botão fica desabilitado por enquanto. -->
        <button
          type="button"
          disabled
          class="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl text-sm font-bold text-white opacity-50"
          style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)"
        >
          Disponível no M4 — Calendário
        </button>
      </div>
    </div>
  </div>
</template>
