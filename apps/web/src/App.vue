<script setup lang="ts" >
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Season } from '@aniweek/shared'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'

const theme = useThemeStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => theme.setSeason(theme.season))

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen">
    <nav class="flex items-center justify-between gap-2 p-4">
      <div class="flex gap-2">
        <button
          v-for="season in Object.values(Season)"
          :key="season"
          class="rounded px-3 py-1 text-sm capitalize"
          :style="{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }"
          @click="theme.setSeason(season)"
        >
          {{ season.toLowerCase() }}
        </button>
      </div>
      <div v-if="auth.user" class="flex items-center gap-2 text-sm">
        <span :style="{ color: 'var(--color-text)' }">{{ auth.user.username }}</span>
        <button class="rounded border px-2 py-1" @click="onLogout">Sair</button>
      </div>
    </nav>
    <RouterView />
  </div>
</template>
