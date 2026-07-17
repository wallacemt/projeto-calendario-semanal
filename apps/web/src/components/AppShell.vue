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
  <div class="flex h-screen overflow-hidden" style="background: var(--ink-bg)">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div
        class="flex h-19 flex-shrink-0 items-center justify-between border-b px-8"
        style="border-color: rgba(255, 255, 255, 0.06)"
      >
        <div>
          <div class="font-display text-[19px] font-extrabold text-white">{{ title }}</div>
          <div v-if="subtitle" class="text-[12.5px] text-(--ink-text-faint)">{{ subtitle }}</div>
        </div>
        <div class="flex items-center gap-3.5">
          <!-- Notificações reais chegam no M10 (SSE) — ícone só decorativo por enquanto. -->
          <div
            class="flex h-9 w-9 items-center justify-center rounded-[10px] border"
            style="background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.08)"
          >
            <Bell :size="16" class="text-(--ink-text-muted)" />
          </div>
          <button
            type="button"
            title="Sair"
            class="flex h-9 w-9 items-center justify-center rounded-[10px] border hover:border-white/20"
            style="background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.08)"
            @click="onLogout"
          >
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
