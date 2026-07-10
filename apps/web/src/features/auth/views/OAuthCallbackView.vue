<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  // O guard global (router/index.ts) já chamou restoreSession() antes de
  // entrar nesta rota — o cookie de refresh setado pelo callback do backend
  // (ADR-11) já foi trocado por um access token em memória, se válido.
  await router.replace(auth.isAuthenticated ? { name: 'home' } : { name: 'login' })
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <p :style="{ color: 'var(--color-text)' }">Entrando...</p>
  </div>
</template>
