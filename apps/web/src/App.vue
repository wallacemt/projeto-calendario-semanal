<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import AppLoader from './components/AppLoader.vue'

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
  booting.value = false
})
</script>

<template>
  <AppLoader v-if="booting" />
  <!-- Sem nav global aqui: rotas autenticadas se envolvem no AppShell (sidebar)
       individualmente — ver components/AppShell.vue e HomeView/ProfileView. -->
  <RouterView v-else />
</template>
