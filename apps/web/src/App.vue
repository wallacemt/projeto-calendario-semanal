<script setup lang="ts" >
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Season } from '@aniweek/shared'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import AppLoader from './components/AppLoader.vue'

const theme = useThemeStore()
const auth = useAuthStore()
const router = useRouter()

// Loading global: cobre a janela entre o app montar e sessão+estação atual
// resolverem. Sem isso, o usuário via uma tela em branco (o router já
// segurava a 1ª navegação até restoreSession() terminar — só não havia
// nada desenhado nesse meio-tempo).
const booting = ref(true)

onMounted(async () => {
  theme.setSeason(theme.season) // aplica o default local já, sem esperar a API
  await Promise.all([auth.restoreSession(), theme.fetchCurrentSeason()])
  booting.value = false
})

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <AppLoader v-if="booting" />
  <div v-else class="min-h-screen">
    <!-- Dev-only: trocador de estação + logout. Só faz sentido dentro do app
         logado (o board reage ao tema); nas telas públicas de auth ele só
         teria vazado por cima do hero recém-desenhado sem estilo nenhum. -->
    <nav v-if="auth.isAuthenticated" class="flex items-center justify-between gap-2 p-4">
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
      <div class="flex items-center gap-2 text-sm">
        <span :style="{ color: 'var(--color-text)' }">{{ auth.user!.username }}</span>
        <button class="rounded border px-2 py-1" @click="onLogout">Sair</button>
      </div>
    </nav>
    <RouterView />
  </div>
</template>
