<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppShell from '../../../components/AppShell.vue'
import StatsSkeleton from '../components/StatsSkeleton.vue'
import { useMuseumStore } from '../store'

const museum = useMuseumStore()
onMounted(() => museum.fetchStats())

const STATUS_COLORS: Record<string, string> = {
  WATCHING: '#2DD4BF',
  PLANNED: '#8B5CF6',
  PAUSED: '#FBBF24',
  DROPPED: '#6B7280',
}
const STATUS_LABELS: Record<string, string> = {
  WATCHING: 'Assistindo',
  PLANNED: 'Planejado',
  PAUSED: 'Pausado',
  DROPPED: 'Abandonado',
}

const statusTotal = computed(
  () => museum.stats?.statusBreakdown.reduce((sum, b) => sum + b.count, 0) ?? 0,
)

// Donut só com CSS (conic-gradient) — sem lib de gráfico pra 1 pizza de 4
// fatias no máximo (ladder: nativo antes de dependência nova).
const donutGradient = computed(() => {
  if (!museum.stats || statusTotal.value === 0) return 'rgba(255,255,255,0.06)'
  let acc = 0
  const stops = museum.stats.statusBreakdown.map((b) => {
    const from = (acc / statusTotal.value) * 100
    acc += b.count
    const to = (acc / statusTotal.value) * 100
    return `${STATUS_COLORS[b.status] ?? '#6B7280'} ${from}% ${to}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

const maxMonthly = computed(() => Math.max(1, ...(museum.stats?.monthly.map((m) => m.count) ?? [1])))
</script>

<template>
  <AppShell title="Estatísticas" subtitle="Análise detalhada dos seus hábitos">
    <div class="p-6 sm:p-8">
      <StatsSkeleton v-if="museum.statsLoading" />

      <div v-else-if="museum.stats" class="flex flex-col gap-5">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-[14px] glass border border-white/8 bg-white/3.5 px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Horas totais (estimado)</div>
            <div class="font-display text-[26px] font-extrabold text-white">{{ museum.stats.totalHours }}h</div>
          </div>
          <div class="rounded-[14px] glass border border-white/8 bg-white/3.5 px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Episódios/semana (méd.)</div>
            <div class="font-display text-[26px] font-extrabold text-white">{{ museum.stats.episodesPerWeek }}</div>
          </div>
          <div class="rounded-[14px] border glass border-white/8 bg-white/3.5 px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Concluídos</div>
            <div class="font-display text-[26px] font-extrabold text-white">{{ museum.stats.totalWatched }}</div>
          </div>
          <div class="rounded-[14px] border glass border-white/8 bg-white/3.5 px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Nota média dada</div>
            <div class="font-display text-[26px] font-extrabold" style="color: #fbbf24">
              {{ museum.stats.avgRating ?? '—' }}
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-5  lg:flex-row">
          <div class="flex-[1.3] glass rounded-[18px] border border-white/8 bg-white/3.5 p-6">
            <div class="font-display mb-5 text-[14.5px] font-bold text-white">Animes concluídos por mês</div>
            <div class="flex h-42.5 items-end gap-3.5">
              <div v-for="m in museum.stats.monthly" :key="m.label" class="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div class="w-full max-w-6.5 rounded-t-[5px]"
                  :style="{ height: `${(m.count / maxMonthly) * 150 + (m.count > 0 ? 8 : 0)}px`, background: 'linear-gradient(180deg,#A78BFA,#8B5CF6)' }" />
                <div class="text-[10px] text-(--ink-text-faint)">{{ m.label }}</div>
              </div>
            </div>
          </div>

          <div class="flex w-full glass flex-col items-center gap-3.5 rounded-[18px] border border-white/8 bg-white/3.5 p-6 lg:w-70">
            <div class="font-display self-start text-[14.5px] font-bold text-white">Distribuição por status</div>
            <div class="flex h-37.5 w-37.5 items-center justify-center rounded-full" :style="{ background: donutGradient }">
              <div class="flex h-27 w-27 flex-col items-center justify-center rounded-full" style="background: #0d0e17">
                <div class="font-display text-[22px] font-extrabold text-white">{{ statusTotal }}</div>
                <div class="text-[9.5px] text-(--ink-text-faint)">no board</div>
              </div>
            </div>
            <div class="flex w-full flex-col gap-1.5">
              <div v-for="b in museum.stats.statusBreakdown" :key="b.status"
                class="flex items-center gap-2 text-[11.5px] text-(--ink-text-muted)">
                <span class="h-2 w-2 rounded-[2px]" :style="{ background: STATUS_COLORS[b.status] ?? '#6B7280' }" />
                {{ STATUS_LABELS[b.status] ?? b.status }} · {{ b.count }}
              </div>
              <p v-if="statusTotal === 0" class="text-[11.5px] text-(--ink-text-faint)">Nada no board agora.</p>
            </div>
          </div>
        </div>

        <div class="rounded-[18px]  glass border border-white/8 bg-white/3.5 p-6">
          <div class="font-display mb-4.5 text-[14.5px] font-bold text-white">Ranking de gêneros</div>
          <div v-if="museum.stats.genreRanking.length === 0" class="text-[12.5px] text-(--ink-text-faint)">
            Marque animes como assistidos pra ver seus gêneros favoritos.
          </div>
          <div v-else class="flex flex-col gap-3">
            <div v-for="(g, i) in museum.stats.genreRanking" :key="g.name" class="flex items-center gap-3.5">
              <div class="w-5 text-[12px] font-bold text-(--ink-text-faint)">{{ i + 1 }}</div>
              <div class="w-25 text-[12.5px] text-(--ink-text)">{{ g.name }}</div>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-white/6">
                <div class="h-full" :style="{ width: `${g.pct}%`, background: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' }" />
              </div>
              <div class="w-9 text-right text-[12px] text-(--ink-text-muted)">{{ g.pct }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
