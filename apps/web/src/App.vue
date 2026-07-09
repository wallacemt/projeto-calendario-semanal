<script setup lang="ts">
import { onMounted } from 'vue'
import { Season } from '@aniweek/shared'
import { useThemeStore } from './stores/theme'

const theme = useThemeStore()
onMounted(() => theme.setSeason(theme.season))
</script>

<template>
  <div class="min-h-screen">
    <nav class="flex gap-2 p-4">
      <button
        v-for="season in Object.values(Season)"
        :key="season"
        class="rounded px-3 py-1 text-sm capitalize"
        :style="{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }"
        @click="theme.setSeason(season)"
      >
        {{ season.toLowerCase() }}
      </button>
    </nav>
    <RouterView />
  </div>
</template>
