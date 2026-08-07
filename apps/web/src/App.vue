<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import { useSocialStore } from './features/social/store'
import AppLoader from './components/AppLoader.vue'
import Toaster from './components/Toaster.vue'
import OfflineOverlay from './components/OfflineOverlay.vue'

const theme = useThemeStore()
const auth = useAuthStore()
const social = useSocialStore()

// Loading global: cobre a janela entre o app montar e sessão+estação atual
// resolverem. Sem isso, o usuário via uma tela em branco (o router já
// segurava a 1ª navegação até restoreSession() terminar — só não havia
// nada desenhado nesse meio-tempo).
const booting = ref(true)

onMounted(async () => {
  theme.setSeason(theme.season) // aplica o default local já, sem esperar a API
  await Promise.all([auth.restoreSession(), theme.fetchCurrentSeason()])
  // GET /themes/active exige sessão — só dispara depois que restoreSession()
  // resolve (não dá pra rodar em paralelo com os dois acima, o access token
  // ainda não existiria no http client).
  if (auth.isAuthenticated) {
    await theme.fetchActiveTheme()
    // Badge do sino (AppShell) + feed em tempo real (M10) — precisa da
    // mesma sessão resolvida acima, mesmo motivo de fetchActiveTheme.
    await social.fetchNotifications()
    social.connectStream()
  }
  booting.value = false
})

// Logout limpa a sessão (stores/auth.ts) mas não sabe nada sobre SSE —
// desconectar aqui em vez de acoplar a store de auth (global) a uma feature
// specífica (social).
watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) social.disconnectStream()
  },
)
</script>

<template>
  <AppLoader v-if="booting" />
  <RouterView v-else />
  <Toaster />
  <OfflineOverlay />
</template>
