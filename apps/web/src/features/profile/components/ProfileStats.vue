<script setup lang="ts">
import type { Profile } from '../api'

defineProps<{ profile: Profile }>()

// O design mostra episódios/horas/gêneros/progresso — mas isso depende de
// Calendar/WatchedAnime (M4/M8), que ainda não existem no schema. Mostrar
// número fake ali seria mentir pro usuário; por ora só o que a API
// realmente calcula (totalAnimesInCalendar, sempre 0 até o M4 emplacar).
</script>

<template>
  <div class="flex flex-1 flex-col gap-4.5 rounded-[18px] border border-white/8 bg-white/3.5 px-7 py-6.5">
    <div class="font-display text-[15.5px] font-bold text-white">Estatísticas gerais</div>

    <div class="rounded-[14px] border border-white/6 bg-white/3 px-4.5 py-4 sm:w-64">
      <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Animes no calendário</div>
      <div class="font-display text-[26px] font-extrabold text-white">
        {{ profile.stats.totalAnimesInCalendar }}
      </div>
    </div>

    <div class="h-px bg-white/6" />
    <div class="flex items-center justify-between">
      <span class="text-[13px] text-(--ink-text-muted)">
        Episódios, gêneros e progresso por temporada chegam com o museu (M8).
      </span>
      <span class="text-[13px] font-semibold text-(--ink-text-faint)">Em breve →</span>
    </div>
  </div>
</template>
