<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <button
    type="button"
    class="font-sans flex h-11.5 flex-1 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/3 text-[13.5px] text-[#e5e7ef] transition duration-200 hover:bg-white/6"
  >
    <slot name="icon" />
    {{ label }}
  </button>
</template>
