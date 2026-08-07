<script setup lang="ts">
import { onMounted } from 'vue'
import type { Profile } from '../api'
import { useMuseumStore } from '../../museum/store'

defineProps<{ profile: Profile }>()

// Mesma store que /estatisticas já usa (StatsView) — reaproveita o cache se
// o usuário já visitou aquela página nesta sessão, em vez de buscar de novo.
const museum = useMuseumStore()
onMounted(() => {
  if (!museum.stats) museum.fetchStats()
})
</script>

<template>
  <div class="flex flex-1 flex-col glass gap-4.5 rounded-[18px] border border-white/8 bg-white/3.5 px-7 py-6.5">
    <div class="font-display text-[15.5px] font-bold text-white">Estatísticas gerais</div>

    <div v-if="museum.statsLoading" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div v-for="n in 4" :key="n" class="rounded-[14px] border border-white/6 bg-white/3 px-4.5 py-4">
        <div class="mb-2.5 h-2.5 w-16 animate-pulse rounded bg-white/8" />
        <div class="h-6 w-10 animate-pulse rounded bg-white/8" />
      </div>
    </div>

    <div v-else-if="museum.stats" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-[14px] border border-white/6 bg-white/3 px-4.5 py-4">
        <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Animes no calendário</div>
        <div class="font-display text-[22px] font-extrabold text-white">
          {{ profile.stats.totalAnimesInCalendar }}
        </div>
      </div>
      <div class="rounded-[14px] border border-white/6 bg-white/3 px-4.5 py-4">
        <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Concluídos</div>
        <div class="font-display text-[22px] font-extrabold text-white">{{ museum.stats.totalWatched }}</div>
      </div>
      <div class="rounded-[14px] border border-white/6 bg-white/3 px-4.5 py-4">
        <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Nota média</div>
        <div class="font-display text-[22px] font-extrabold" style="color: #fbbf24">
          {{ museum.stats.avgRating ?? '—' }}
        </div>
      </div>
      <div class="rounded-[14px] border border-white/6 bg-white/3 px-4.5 py-4">
        <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Gênero favorito</div>
        <div class="font-display truncate text-[16px] font-extrabold text-white">
          {{ museum.stats.genreRanking[0]?.name ?? '—' }}
        </div>
      </div>
    </div>

    <div class="h-px bg-white/6" />
    <RouterLink
      :to="{ name: 'stats' }"
      class="flex items-center justify-between text-[13px] font-semibold text-(--brand-primary) hover:text-(--brand-secondary)"
    >
      Ver estatísticas completas
      <span aria-hidden="true">→</span>
    </RouterLink>
  </div>
</template>
