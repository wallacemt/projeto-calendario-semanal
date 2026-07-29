<script setup lang="ts">
// Input de nota 1..10 reutilizado pelo museu (add direto) e pelo calendário
// (mark-watched) — 2+ features, por isso mora em src/components e não
// dentro de uma feature (mesma regra de src/styles do CLAUDE.md).
withDefaults(defineProps<{ modelValue: number; max?: number }>(), { max: 10 })
const emit = defineEmits<{ 'update:modelValue': [number] }>()
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <button v-for="n in max" :key="n" type="button" class="text-xl leading-none transition-colors"
      :style="{ color: n <= modelValue ? '#FBBF24' : 'rgba(255,255,255,0.15)' }"
      @click="emit('update:modelValue', n)">★</button>
  </div>
</template>
