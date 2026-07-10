<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

// Placeholder — o calendário semanal (RF-04, M4) substitui esta view. Existe
// só para a rota "/" (protegida por auth) ter um componente próprio, em vez
// de reaproveitar o App.vue (que já é o shell com o RouterView).
const auth = useAuthStore()
</script>

<template>
  <div class="p-6" :style="{ color: 'var(--color-text)' }">
    <p>Bem-vindo, {{ auth.user?.username }}.</p>
    <p class="text-sm opacity-70">O calendário semanal chega no M4.</p>
  </div>
</template>
