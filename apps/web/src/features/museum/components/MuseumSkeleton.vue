<script setup lang="ts">
// Mesmo padrão do AnimeCardSkeleton (discover): só estrutura + animate-pulse,
// ecoando o layout real do MuseumView (vitrine + tiles + grid de troféus).
</script>

<template>
  <div class="p-6 sm:p-8">
    <div
      class="mb-5.5 flex items-center gap-8 rounded-[22px] border p-7.5 glass"
      style="border-color: rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.02)"
    >
      <div class="h-66 w-47.5 flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
      <div class="flex flex-1 flex-col gap-3">
        <div class="h-3 w-32 animate-pulse rounded bg-white/8" />
        <div class="h-6 w-2/3 animate-pulse rounded bg-white/8" />
        <div class="h-3 w-1/2 animate-pulse rounded bg-white/6" />
      </div>
    </div>

    <div class="mb-6.5 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div v-for="n in 4" :key="n" class="rounded-[14px] glass border border-white/8 bg-white/3.5 px-5 py-4.5">
        <div class="mb-2.5 h-2.5 w-20 animate-pulse rounded bg-white/8" />
        <div class="h-6 w-12 animate-pulse rounded bg-white/8" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4.5 sm:grid-cols-3 lg:grid-cols-5">
      <div
        v-for="n in 10"
        :key="n"
        class="h-77.5 animate-pulse glass rounded-2xl border border-white/9 bg-white/3.5"
      />
    </div>
  </div>
</template>
