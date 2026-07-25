<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import AppLoader from './components/AppLoader.vue'
import Toaster from './components/Toaster.vue'

const theme = useThemeStore()
const auth = useAuthStore()

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
  if (auth.isAuthenticated) await theme.fetchActiveTheme()
  booting.value = false
})
</script>

<template>
  <AppLoader v-if="booting" />
  <!-- Sem nav global aqui: rotas autenticadas se envolvem no AppShell (sidebar)
       individualmente — ver components/AppShell.vue e HomeView/ProfileView. -->
  <RouterView v-else />
  <Toaster />
</template>
