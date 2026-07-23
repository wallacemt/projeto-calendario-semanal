<script setup lang="ts">
import { WEEKDAY_META, WEEKDAY_ORDER } from '../weekday-meta'

// Placeholder de pré-carregamento do board (mesmo padrão do
// AnimeCardSkeleton do discover — só estrutura + animate-pulse do Tailwind,
// sem lib nova) — ecoa o layout real do CalendarView: 1 coluna "expandida"
// com cards fantasma, as outras 7 colapsadas, mesma ordem de dias.
const collapsedDays = WEEKDAY_ORDER.slice(1).map((key) => WEEKDAY_META[key])
</script>

<template>
  <div class="flex flex-1 gap-3 overflow-hidden p-6">
    <div
      class="flex h-full flex-col gap-2.5 overflow-hidden rounded-[14px] p-3.5"
      style="flex: 4 1 420px; min-width: 340px"
    >
      <div class="flex items-center justify-between px-0.5">
        <div class="h-3 w-10 animate-pulse rounded bg-white/8" />
        <div class="h-5 w-5 animate-pulse rounded-md bg-white/6" />
      </div>
      <div class="grid flex-1 grid-cols-4 content-start gap-2.5 pb-1">
        <div
          v-for="n in 8"
          :key="n"
          class="overflow-hidden rounded-[13px] border"
          style="border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.035)"
        >
          <div class="aspect-[2/3] animate-pulse bg-white/5" />
          <div class="space-y-1.5 p-2.25 pb-2.75">
            <div class="h-2.5 w-full animate-pulse rounded bg-white/8" />
            <div class="h-2.5 w-2/3 animate-pulse rounded bg-white/8" />
            <div class="h-1 w-full animate-pulse rounded-full bg-white/6" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-for="day in collapsedDays"
      :key="day.short"
      class="flex h-full flex-shrink-0 flex-col items-center gap-3.5 rounded-[14px] border py-4"
      style="flex: 0 0 4.5rem; min-width: 4.5rem; border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.02)"
    >
      <div class="h-5 w-5 animate-pulse rounded-md bg-white/6" />
      <div class="h-16 w-2.5 animate-pulse rounded bg-white/8" />
    </div>
  </div>
</template>
