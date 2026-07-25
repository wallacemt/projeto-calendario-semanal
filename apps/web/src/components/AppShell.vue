<script setup lang="ts">
import { Bell, LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppSidebar from './AppSidebar.vue'

// Shell global das rotas autenticadas (design AnimeWeek Perfil.dc.html):
// sidebar fixa + topbar com título da página + slot pro conteúdo. Substitui
// a topbar solta que existia antes em App.vue — "Sair" migrou pra cá porque
// o design não tem mais um nav global onde ele morava antes.
defineProps<{ title: string; subtitle?: string }>()

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <!-- Sem bg sólido aqui de propósito: deixa o bg-image+overlay do body (M7,
       style.css) aparecer por trás — ver AnimeSidebar/áreas internas pra onde
       o app ainda precisa de opacidade (cards, sidebar). -->
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div class="glass glass-strong flex h-19 flex-shrink-0 items-center justify-between rounded-none border-x-0 border-t-0 px-8">
        <div>
          <div class="font-display text-[19px] font-extrabold text-white">{{ title }}</div>
          <div v-if="subtitle" class="text-[12.5px] text-(--ink-text-faint)">{{ subtitle }}</div>
        </div>
        <div class="flex items-center gap-3.5">
          <!-- Notificações reais chegam no M10 (SSE) — ícone só decorativo por enquanto. -->
          <div class="glass flex h-9 w-9 items-center justify-center rounded-[10px]">
            <Bell :size="16" class="text-(--ink-text-muted)" />
          </div>
          <button type="button" title="Sair" class="glass flex h-9 w-9 items-center justify-center rounded-[10px] hover:border-white/30"
            @click="onLogout">
            <LogOut :size="16" class="text-(--ink-text-muted)" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
