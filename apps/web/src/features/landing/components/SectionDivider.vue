<script setup lang="ts">
// Divisor entre seções: linha fina + 3 pontinhos coloridos centralizados —
// mesmo motivo do mockup original, repetido entre toda transição de seção.
</script>

<template>
  <div class="relative h-px bg-white/7">
    <div class="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 bg-(--ink-bg) px-4">
      <span class="h-1.25 w-1.25 rounded-full" style="background: rgba(244, 114, 182, 0.55)" />
      <span class="h-1.5 w-1.5 rounded-full" style="background: #b23a3a; box-shadow: 0 0 10px rgba(178, 58, 58, 0.55)" />
      <span class="h-1.25 w-1.25 rounded-full" style="background: rgba(139, 92, 246, 0.55)" />
    </div>
  </div>
</template>
