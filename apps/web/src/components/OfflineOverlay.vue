<script setup lang="ts">
// Offline é estado de rede, não uma rota: sobrepõe a tela atual (preserva o
// deep-link) em vez de navegar pra longe dela, ao contrário dos outros
// estados de sistema (404/500/403/manutenção) que são páginas de verdade —
// ver features/system/. Sem imagem de mascote própria (não tem asset em
// public/system/ pra esse estado) — ícone cobre o mesmo lugar.
import { ref, onMounted, onUnmounted } from 'vue'


const isOffline = ref(!navigator.onLine)

function setOnline() {
  isOffline.value = false
}
function setOffline() {
  isOffline.value = true
}

function reload() {
  location.reload()
}

onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOffline)
})
onUnmounted(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOffline)
})
</script>

<template>
  <div v-if="isOffline"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-(--ink-bg)/97 px-6 text-center backdrop-blur-sm">
    <div class="flex  items-center justify-center rounded-3xl">
      <img src="/system/offline.png" alt="offline" class="h-44 w-44 rounded-3xl object-cover shadow-2xl" />
    </div>
    <div>
      <div class="font-display mb-2 text-[19px] font-extrabold text-white">Perdemos o sinal.</div>
      <p class="max-w-sm text-[13px] leading-[1.65] text-(--ink-text-muted)">
        Parece que sua internet caiu. Verifique a conexão — seu progresso local fica salvo e sincroniza quando
        voltar.
      </p>
    </div>
    <button type="button" class="flex h-10.5 items-center rounded-[11px] px-5 text-[13px] font-bold text-white"
      style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" @click="reload">
      Tentar reconectar
    </button>
  </div>
</template>
