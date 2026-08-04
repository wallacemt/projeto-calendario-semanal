<script setup lang="ts">
import { Bell, LogOut } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSocialStore } from '../features/social/store'
import AppSidebar from './AppSidebar.vue'

// Shell global das rotas autenticadas (design AnimeWeek Perfil.dc.html):
// sidebar fixa + topbar com título da página + slot pro conteúdo. Substitui
// a topbar solta que existia antes em App.vue — "Sair" migrou pra cá porque
// o design não tem mais um nav global onde ele morava antes.
defineProps<{ title: string; subtitle?: string }>()

const auth = useAuthStore()
const social = useSocialStore()
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
      <div
        class="glass glass-strong flex h-19 flex-shrink-0 items-center justify-between rounded-none border-x-0 border-t-0 px-8">
        <div>
          <div class="font-display text-[19px] font-extrabold text-white">{{ title }}</div>
          <div v-if="subtitle" class="text-[12.5px] text-(--ink-text-faint)">{{ subtitle }}</div>
        </div>
        <div class="flex items-center gap-3.5">
          <!-- Feed real + SSE ligados no App.vue (M10) — badge é só a contagem de
               não lidas, o feed em si mora na aba "Social & Notificações". -->
          <RouterLink :to="{ name: 'social' }"
            class="relative glass flex h-9 w-9 items-center justify-center rounded-[10px]">
            <Bell :size="16" class="text-(--ink-text-muted)" />
            <span v-if="social.unreadCount > 0"
              class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 px-0.5 text-[9px] font-extrabold text-white"
              style="background: #f87171; border-color: #05060b">
              {{ social.unreadCount > 9 ? '9+' : social.unreadCount }}
            </span>
          </RouterLink>
          <button type="button" title="Sair"
            class="glass flex h-9 w-9 items-center justify-center rounded-[10px] hover:border-white/30"
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
