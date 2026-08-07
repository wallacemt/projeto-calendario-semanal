<script setup lang="ts">
import type { AnimeDto } from '@aniweek/shared'

defineProps<{ anime: AnimeDto; selected?: boolean }>()
defineEmits<{ select: [anime: AnimeDto] }>()
</script>

<template>
  <button
    type="button"
    class="glass flex flex-col overflow-hidden rounded-2xl text-left transition-colors"
    :class="selected ? 'border-(--brand-secondary)/50 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]' : 'hover:border-white/30'"
    @click="$emit('select', anime)"
  >
    <!-- aspect-[2/3] (proporção padrão de pôster) em vez de h-100 fixo: um
         h-100 fixo virava um cartaz gigante e desproporcional quando a
         coluna do grid encolhia em telas menores — aspect-ratio nativo
         acompanha a largura disponível em qualquer breakpoint sem precisar
         de h-56/h-72/h-100 responsivo duplicado por classe. -->
    <div class="relative aspect-[2/3] flex-shrink-0 bg-white/5">
      <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.title" class="h-full w-full object-cover" />
      <div
        v-if="anime.score"
        class="absolute top-2 right-2 rounded-md px-2 py-0.5 text-[11px] font-bold"
        style="background: rgba(5, 6, 9, 0.7); color: #fbbf24"
      >
        ★ {{ anime.score.toFixed(1) }}
      </div>
    </div>
    <div class="flex flex-col gap-2 p-3.5">
      <div class="line-clamp-2 text-[13.5px] font-bold text-white">{{ anime.title }}</div>
      <div class="text-[11px] text-(--ink-text-faint)">
        {{ [anime.type, anime.episodes ? `${anime.episodes} eps` : null, anime.year].filter(Boolean).join(' · ') }}
      </div>
      <div v-if="anime.genres.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="genre in anime.genres.slice(0, 2)"
          :key="genre"
          class="rounded-full px-2 py-0.5 text-[10px] text-(--ink-text-muted)"
          style="background: rgba(255, 255, 255, 0.06)"
        >
          {{ genre }}
        </span>
      </div>
    </div>
  </button>
</template>
