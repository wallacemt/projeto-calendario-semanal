<script setup lang="ts">
// Selo hanko (carimbo japonês) — mesmo motivo do mockup original da landing
// (Claude Design), portado 1:1: quadrado vermelho rotacionado com um kanji,
// usado tanto no hero ("novo") quanto como eyebrow de cada seção.
withDefaults(defineProps<{ char: string; size?: 'sm' | 'md' }>(), { size: 'sm' })
</script>

<template>
  <span
    class="hanko-stamp inline-flex shrink-0 items-center justify-center rounded"
    :class="size === 'md' ? 'h-6.5 w-6.5 text-[13px]' : 'h-5 w-5 text-[11px]'"
    style="background: #b23a3a; color: #fdeeee; font-family: serif; transform: rotate(-6deg)"
  >
    {{ char }}
  </span>
</template>

<style scoped>
.hanko-stamp {
  animation: aw-shimmer 3s ease-in-out infinite;
}
@keyframes aw-shimmer {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
</style>
