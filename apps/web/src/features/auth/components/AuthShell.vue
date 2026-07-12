<script setup lang="ts">
import AuthHeroPanel from './AuthHeroPanel.vue'
import AuthBrandCompact from './AuthBrandCompact.vue'

// Layout comum das telas de auth (login, registro, esqueci/redefinir senha,
// verificar e-mail): hero sazonal fixo à esquerda (>=lg) + painel de conteúdo
// centralizado à direita, com bg opaco (--ink-bg) pra não herdar a foto de
// fundo por estação do shell autenticado — ver tokens.css.
defineProps<{ heroSubtitle: string }>()
</script>

<template>
  <div class="flex min-h-screen bg-[color:var(--ink-bg)]">
    <AuthHeroPanel :subtitle="heroSubtitle">
      <slot name="hero-title" />
    </AuthHeroPanel>

    <div class="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12">
      <div
        v-motion
        class="w-full max-w-sm"
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 450, delay: 120 } }"
      >
        <AuthBrandCompact />
        <slot />
      </div>
    </div>
  </div>
</template>
