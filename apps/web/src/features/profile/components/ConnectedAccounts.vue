<script setup lang="ts">
import { AuthProvider } from '@aniweek/shared'
import type { Profile } from '../api'

const props = defineProps<{ profile: Profile }>()

// "Conectar" um provedor extra a uma conta já existente é um fluxo que ainda
// não existe no backend (as rotas /auth/oauth/* de hoje são login/registro,
// não linking) — por isso mostramos só o status, sem CTA pra uma ação que
// falharia.
const providers = [
  { id: AuthProvider.GOOGLE, label: 'Google', badge: 'G' },
  { id: AuthProvider.GITHUB, label: 'GitHub', badge: 'GH' },
] as const

function isConnected(id: AuthProvider) {
  return props.profile.connectedProviders.includes(id)
}
</script>

<template>
  <div class="rounded-[18px] border border-white/8 bg-white/3.5 px-5.5 py-5.5">
    <div class="font-display mb-3.5 text-[14.5px] font-bold text-white">Conectado via</div>
    <div
      v-for="(provider, i) in providers"
      :key="provider.id"
      class="flex items-center justify-between py-2.5"
      :class="{ 'border-b border-white/6': i < providers.length - 1 }"
    >
      <div class="flex items-center gap-2.5 text-[13.5px] text-(--ink-text)">
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-black">
          {{ provider.badge }}
        </span>
        {{ provider.label }}
      </div>
      <span v-if="isConnected(provider.id)" class="text-[11.5px]" style="color: #5eead4">Conectado</span>
      <span v-else class="text-[11.5px] text-(--ink-text-faint)">Não conectado</span>
    </div>
  </div>
</template>
