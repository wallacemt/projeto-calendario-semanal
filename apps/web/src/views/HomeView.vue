<script setup lang="ts">
import { Season } from '@aniweek/shared'
import AppShell from '../components/AppShell.vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

// Placeholder — o calendário semanal (RF-04, M4) substitui esta view. Existe
// só para a rota "/" (protegida por auth) ter um componente próprio, em vez
// de reaproveitar o App.vue (que já é o shell com o RouterView).
const auth = useAuthStore()
const theme = useThemeStore()
</script>

<template>
  <AppShell title="Calendário" subtitle="O board semanal chega no M4">
    <div class="p-8" style="color: var(--ink-text)">
      <p>Bem-vindo, {{ auth.user?.username }}.</p>
      <p class="mt-1 text-sm text-(--ink-text-faint)">O calendário semanal chega no M4.</p>

      <!-- Dev-only: trocador de estação, só pra exercitar o theme store
           enquanto o board de verdade não existe. -->
      <div class="mt-6 flex gap-2">
        <button
          v-for="season in Object.values(Season)"
          :key="season"
          class="rounded px-3 py-1 text-sm capitalize"
          :style="{ backgroundColor: 'var(--brand-primary)', color: 'white' }"
          @click="theme.setSeason(season)"
        >
          {{ season.toLowerCase() }}
        </button>
      </div>
    </div>
  </AppShell>
</template>
