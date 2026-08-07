<script setup lang="ts">
// Kanji gigante e quase invisível ao fundo de cada seção — mesmo motivo do
// mockup original (週刊 no hero, 特徴 em recursos, 続く no CTA final, 終 no
// footer). Puramente decorativo: aria-hidden, sem função semântica.
// Posicionamento vem via `class` do pai (fallthrough attrs do Vue 3).
withDefaults(defineProps<{ char: string; vertical?: boolean; size?: number; opacity?: number }>(), {
  vertical: false,
  size: 140,
  // Contra uma seção escura/lisa, 3.5% já lê bem. Sobre foto (hero, CTA com
  // background-image) precisa de mais peso pra não desaparecer no ruído
  // visual da imagem — por isso é ajustável por instância.
  opacity: 0.035,
})
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute leading-none select-none"
    :style="{
      fontFamily: 'serif',
      fontSize: `${size}px`,
      color: `rgba(255, 255, 255, ${opacity})`,
      writingMode: vertical ? 'vertical-rl' : 'horizontal-tb',
    }"
  >
    {{ char }}
  </div>
</template>
