<script setup lang="ts">
import { computed } from 'vue'

// Espelha 1:1 os cálculos de `theme` do mockup (AnimeWeek Temas.dc.html) —
// só troca `this.state.accent/accent2` por props reativas.
const props = defineProps<{ accent: string; accent2: string; bgImageUrl?: string | null }>()

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const accentGrad = computed(() => `linear-gradient(135deg,${props.accent},${props.accent2})`)
const posterGrad = computed(
  () =>
    `repeating-linear-gradient(45deg, ${rgba(props.accent, 0.28)}, ${rgba(props.accent, 0.28)} 7px, rgba(255,255,255,0.04) 7px, rgba(255,255,255,0.04) 14px)`,
)
const posterGrad2 = computed(
  () =>
    `repeating-linear-gradient(45deg, ${rgba(props.accent2, 0.26)}, ${rgba(props.accent2, 0.26)} 7px, rgba(255,255,255,0.03) 7px, rgba(255,255,255,0.03) 14px)`,
)
const donutGrad = computed(() => `conic-gradient(${props.accent} 0% 68%, rgba(255,255,255,0.07) 68% 100%)`)
const badgeBg = computed(() => rgba(props.accent, 0.14))
const badgeBorder = computed(() => rgba(props.accent, 0.32))
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 overflow-hidden">
    <div class="text-[13px] text-(--ink-text-faint)">Preview ao vivo</div>
    <div
      class="flex flex-1 flex-col gap-5.5 overflow-hidden rounded-[20px] border p-7"
      :style="{
        borderColor: 'rgba(255,255,255,0.08)',
        background: bgImageUrl
          ? `linear-gradient(rgba(10,11,18,0.72), rgba(10,11,18,0.86)), url(${bgImageUrl}) center/cover`
          : '#0a0b12',
      }"
    >
      <div class="flex items-center justify-between">
        <div class="font-display text-base font-extrabold text-white">Segunda-feira</div>
        <div
          class="flex h-9 items-center rounded-[9px] px-4 text-[12.5px] font-bold text-white"
          :style="{ background: accentGrad }"
        >
          + Adicionar anime
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="overflow-hidden rounded-2xl border" style="background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.09)">
          <div class="relative h-30" :style="{ background: posterGrad }">
            <span class="absolute top-1.5 right-2 rounded-md px-1.75 py-0.75 text-[10.5px] font-bold" style="background: rgba(5,6,9,0.75); color: #fbbf24">★ 8.9</span>
          </div>
          <div class="p-3.25 pt-3">
            <div class="mb-2 text-[12.5px] font-bold text-(--ink-text)">Solo Leveling S2</div>
            <div class="mb-2.25 h-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.07)">
              <div class="h-full w-[70%]" :style="{ background: accentGrad }" />
            </div>
            <div class="inline-flex rounded-full px-2 py-0.75 text-[9.5px] font-semibold" :style="{ background: badgeBg, border: `1px solid ${badgeBorder}`, color: accent2 }">
              Assistindo
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border" style="background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.09)">
          <div class="relative h-30" :style="{ background: posterGrad2 }">
            <span class="absolute top-1.5 right-2 rounded-md px-1.75 py-0.75 text-[10.5px] font-bold" style="background: rgba(5,6,9,0.75); color: #fbbf24">★ 8.1</span>
          </div>
          <div class="p-3.25 pt-3">
            <div class="mb-2 text-[12.5px] font-bold text-(--ink-text)">Kaiju No. 8</div>
            <div class="mb-2.25 h-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.07)">
              <div class="h-full w-[40%]" :style="{ background: accentGrad }" />
            </div>
            <div class="inline-flex rounded-full border px-2 py-0.75 text-[9.5px] font-semibold" style="background: rgba(167,139,250,0.12); border-color: rgba(167,139,250,0.3); color: #a78bfa">
              Planejado
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-2xl border p-5" style="background: rgba(255,255,255,0.035); border-color: rgba(255,255,255,0.08)">
        <div class="text-[13px] font-semibold text-(--ink-text)">Progresso geral</div>
        <div class="flex items-center gap-4">
          <div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full" :style="{ background: donutGrad }">
            <div class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[#0a0b12] text-xs font-extrabold text-white">68%</div>
          </div>
          <div class="flex flex-1 flex-col gap-2">
            <div class="h-1.5 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.07)">
              <div class="h-full w-[80%]" :style="{ background: accentGrad }" />
            </div>
            <div class="h-1.5 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.07)">
              <div class="h-full w-[55%]" :style="{ background: accentGrad }" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-2.5">
        <div class="rounded-[9px] px-4 py-2.25 text-[12.5px] font-bold text-white" :style="{ background: accentGrad }">Botão primário</div>
        <div class="rounded-[9px] border px-4 py-2.25 text-[12.5px] font-semibold" :style="{ borderColor: accent, color: accent }">Botão secundário</div>
        <a href="#" class="pt-2.25 text-[12.5px]" :style="{ color: accent }" @click.prevent>Link de exemplo</a>
      </div>
    </div>
  </div>
</template>
