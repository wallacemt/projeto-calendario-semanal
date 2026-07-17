<script setup lang="ts">
import { useThemeStore } from '../../../stores/theme'
import { seasonMeta } from '../lib/season-meta'

const theme = useThemeStore()
</script>

<template>
  <!-- Marca compacta — só aparece abaixo do breakpoint onde o hero se esconde
       (ver AuthShell). O AuthHeroPanel já carrega a versão completa. -->
  <div class="mb-8 flex items-center gap-2 lg:hidden">
    <img src="../../../assets/icon_with_text_and_bg.png" alt="" class="h-32 w-60 object-contain" />
    <!-- <span class="font-display text-base font-extrabold text-(--ink-text)">AnimeWeek</span> -->
    <span class="ml-auto text-xs text-(--ink-text-muted)">
      {{ seasonMeta[theme.season].emoji }} {{ seasonMeta[theme.season].label }}
    </span>
  </div>
</template>
