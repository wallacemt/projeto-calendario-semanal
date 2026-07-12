<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

withDefaults(defineProps<{ type?: 'submit' | 'button'; loading?: boolean; disabled?: boolean }>(), {
  type: 'button',
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="font-sans flex h-12.5 w-full items-center justify-center gap-2 rounded-md text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(108,99,255,0.35)] transition duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
    style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))"
  >
    <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" :stroke-width="2.5" />
    <slot />
  </button>
</template>
