<script setup lang="ts">
// Mesmo padrão de skeleton dos demais (só estrutura + animate-pulse),
// ecoando o layout real do StatsView (tiles + gráfico + donut + ranking).
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div v-for="n in 4" :key="n" class=" glass rounded-[14px] border border-white/8 bg-white/3.5 px-5 py-4.5">
        <div class="mb-2.5 h-2.5 w-24 animate-pulse rounded bg-white/8" />
        <div class="h-6 w-14 animate-pulse rounded bg-white/8" />
      </div>
    </div>

    <div class="flex flex-col gap-5  lg:flex-row">
      <div class="flex-[1.3] glass rounded-[18px] border border-white/8 bg-white/3.5 p-6">
        <div class="mb-5 h-3.5 w-44 animate-pulse rounded bg-white/8" />
        <div class="flex h-42.5 items-end gap-3.5">
          <div v-for="n in 6" :key="n" class="h-full flex-1 animate-pulse rounded-t-[5px] bg-white/5" />
        </div>
      </div>
      <div class="flex w-full glass flex-col items-center gap-3.5 rounded-[18px] border border-white/8 bg-white/3.5 p-6 lg:w-70">
        <div class="self-start h-3.5 w-32 animate-pulse rounded bg-white/8" />
        <div class="h-37.5 w-37.5 animate-pulse rounded-full bg-white/5" />
      </div>
    </div>

    <div class="rounded-[18px] border glass  border-white/8 bg-white/3.5 p-6">
      <div class="mb-4.5 h-3.5 w-36 animate-pulse rounded bg-white/8" />
      <div class="flex flex-col gap-3">
        <div v-for="n in 5" :key="n" class="h-2 animate-pulse rounded-full bg-white/6" />
      </div>
    </div>
  </div>
</template>
