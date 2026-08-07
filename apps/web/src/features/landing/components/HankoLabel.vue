<script setup lang="ts">
import HankoStamp from './HankoStamp.vue'

// Eyebrow de seção: barrinha gradiente + hanko + label mono — substitui o
// <span class="font-mono"> genérico que tinha antes, também 1:1 do mockup.
defineProps<{ char: string; label: string }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div
      class="h-0.75 w-27.5 rounded-full"
      style="background: linear-gradient(90deg, transparent, #f472b6, var(--brand-primary), transparent)"
    />
    <div class="flex items-center gap-2">
      <HankoStamp :char="char" />
      <span class="font-mono text-[11.5px] tracking-[0.12em] text-(--brand-secondary)">{{ label }}</span>
    </div>
  </div>
</template>
