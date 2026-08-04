<script setup lang="ts">
import { ref } from 'vue'
// Usado só pelo boot do App.vue enquanto sessão + estação atual carregam —
// por isso mora em components/ (raiz), não dentro de uma feature (docs/architecture.md).
const messages = ref([
  'Preparando sua semana...',
  'Carregando episódios...',
  'Buscando novidades...',
  'Ajustando o calendário...',
  'Organizando os animes...',
  'Quase pronto...',
])

const message = ref(messages.value[Math.floor(Math.random() * messages.value.length)])

setInterval(() => {
  message.value = messages.value[Math.floor(Math.random() * messages.value.length)]
}, 3000)
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-(--ink-bg)">
    <div class="flex items-center gap-2.5">
      <img src="../assets/icon_with_text_and_bg.png" alt="" class="animate-breathe h-42 w-60 object-contain" />
    </div>

    <!-- 7 barras = 7 dias da semana "acendendo" em onda — assinatura do
         loading, não um spinner genérico (ver theme.css: aw-week-tick). -->
    <div class="flex items-end gap-1.5" role="presentation" aria-hidden="true">
      <span v-for="i in 7" :key="i" class="w-1.5 rounded-full" style="
          height: 20px;
          background: linear-gradient(180deg, var(--brand-primary), var(--brand-secondary));
          animation: aw-week-tick 1.1s ease-in-out infinite;
        " :style="{ animationDelay: `${i * 0.09}s` }" />
    </div>

    <p class="font-mono text-[11px] tracking-[0.14em] text-(--ink-text-faint) uppercase">
      {{ message }}
    </p>
  </div>
</template>
