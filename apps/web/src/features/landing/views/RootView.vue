<script setup lang="ts">
// '/' é a única rota com dois donos: visitante vê a Landing (pública, pensada
// pra SEO — ver auditoria), usuário autenticado vê o calendário. Um só
// componente decidindo em runtime evita duplicar a rota (path repetido não é
// permitido no vue-router) e mantém o guard global simples: '/' não tem mais
// requiresAuth, então um crawler não autenticado nunca é redirecionado pro
// /login como acontecia antes.
import { useAuthStore } from '../../../stores/auth'
import CalendarView from '../../calendar/views/CalendarView.vue'
import LandingView from './LandingView.vue'

const auth = useAuthStore()
</script>

<template>
  <CalendarView v-if="auth.isAuthenticated" />
  <LandingView v-else />
</template>
