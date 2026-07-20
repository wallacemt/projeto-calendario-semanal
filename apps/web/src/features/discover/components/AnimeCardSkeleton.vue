<script setup lang="ts">
// Placeholder de pré-renderização pro grid de resultados (troca o texto
// "Buscando..." por algo que já ecoa o layout real do AnimeCard) — só
// estrutura + animate-pulse do Tailwind, sem estado/lógica própria.
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/3.5">
    <div class="h-100 flex-shrink-0 animate-pulse bg-white/5" />
    <div class="flex flex-col gap-2 p-3.5">
      <div class="h-3.5 w-4/5 animate-pulse rounded bg-white/8" />
      <div class="h-3 w-2/5 animate-pulse rounded bg-white/8" />
      <div class="flex gap-1.5">
        <div class="h-4.5 w-14 animate-pulse rounded-full bg-white/6" />
        <div class="h-4.5 w-16 animate-pulse rounded-full bg-white/6" />
      </div>
    </div>
  </div>
</template>
