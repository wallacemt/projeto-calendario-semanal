<script setup lang="ts">
import type { SystemStateConfig } from '../config'

defineProps<SystemStateConfig>()

function reload() {
  location.reload()
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--ink-bg) px-6 py-12">
    <div
      class="pointer-events-none absolute inset-0"
      :style="{
        background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${accent} 16%, transparent), transparent 60%)`,
      }"
    />

    <div class="relative z-10 flex w-full max-w-md flex-col items-center gap-6 text-center">
      <img :src="image" :alt="title" class="h-44 w-44 rounded-3xl object-cover shadow-2xl" />

      <div class="font-mono text-[10.5px] tracking-[0.06em]" :style="{ color: accent }">{{ tag }}</div>
      <div class="font-display text-[56px] leading-none font-extrabold" :style="{ color: accent }">{{ code }}</div>

      <div>
        <div class="font-display mb-2 text-[19px] font-extrabold text-white">{{ title }}</div>
        <p class="max-w-sm text-[13px] leading-[1.65] text-(--ink-text-muted)">{{ desc }}</p>
      </div>

      <div class="mt-1 flex gap-2.5">
        <RouterLink
          v-if="primary.to"
          :to="primary.to"
          class="flex h-10.5 items-center rounded-[11px] px-5 text-[13px] font-bold text-white"
          style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))"
        >
          {{ primary.label }}
        </RouterLink>
        <button
          v-else
          type="button"
          class="flex h-10.5 items-center rounded-[11px] px-5 text-[13px] font-bold text-white"
          style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))"
          @click="reload"
        >
          {{ primary.label }}
        </button>

        <RouterLink
          v-if="secondary?.to"
          :to="secondary.to"
          class="flex h-10.5 items-center rounded-[11px] border border-white/12 px-4.5 text-[13px] font-semibold text-(--ink-text-muted) hover:text-(--ink-text)"
        >
          {{ secondary.label }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
