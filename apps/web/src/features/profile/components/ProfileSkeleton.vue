<script setup lang="ts">
// Mesmo padrão do AnimeCardSkeleton/CalendarBoardSkeleton: só estrutura +
// animate-pulse, ecoando o layout real (ProfileCard + ProfileInfo/Stats).
</script>

<template>
  <div class="flex flex-col gap-6 p-8 lg:flex-row">
    <div class="flex w-full flex-col gap-5 lg:w-95 lg:flex-shrink-0">
      <div class="flex flex-col items-center rounded-[18px] border border-white/8 bg-white/3.5 px-6 py-7">
        <div class="mb-4 h-26 w-26 animate-pulse rounded-full bg-white/8" />
        <div class="mb-2 h-4.5 w-32 animate-pulse rounded bg-white/8" />
        <div class="h-3 w-20 animate-pulse rounded bg-white/6" />
      </div>
      <div class="h-24 animate-pulse rounded-[18px] border border-white/8 bg-white/3.5" />
      <div class="h-24 animate-pulse rounded-[18px] border border-white/8 bg-white/3.5" />
    </div>

    <div class="flex flex-1 flex-col gap-5">
      <div class="flex flex-col gap-4 rounded-[18px] border border-white/8 bg-white/3.5 px-7 py-6.5">
        <div class="h-4 w-40 animate-pulse rounded bg-white/8" />
        <div class="h-10 animate-pulse rounded-[10px] bg-white/5" />
        <div class="h-10 animate-pulse rounded-[10px] bg-white/5" />
      </div>
      <div class="flex flex-col gap-4.5 rounded-[18px] border border-white/8 bg-white/3.5 px-7 py-6.5">
        <div class="h-4 w-36 animate-pulse rounded bg-white/8" />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-[14px] bg-white/5" />
        </div>
      </div>
    </div>
  </div>
</template>
