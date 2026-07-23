<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '../../../stores/theme'
import { seasonMeta } from '../../../lib/season-meta'
import PosterCarousel from './PosterCarousel.vue'

defineProps<{ subtitle: string }>()

const theme = useThemeStore()
const meta = computed(() => seasonMeta[theme.season])
</script>

<template>
  <div class="relative hidden w-105 shrink-0 flex-col justify-between overflow-hidden p-11 lg:flex xl:w-145"
    style="
      background:
        radial-gradient(circle at 25% 15%, color-mix(in srgb, var(--season-accent-1) 34%, transparent), transparent 55%),
        radial-gradient(circle at 85% 75%, color-mix(in srgb, var(--season-accent-2) 30%, transparent), transparent 55%),
        linear-gradient(165deg, #0c1024 0%, #05060b 75%);
    ">
    <!-- Starfield decorativo — puramente atmosférico, não deve ser lido por leitor de tela. -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0" style="
        background-image:
          radial-gradient(1.5px 1.5px at 15% 20%, rgba(255, 255, 255, 0.6), transparent),
          radial-gradient(1.5px 1.5px at 75% 12%, rgba(255, 255, 255, 0.45), transparent),
          radial-gradient(1.5px 1.5px at 40% 55%, rgba(255, 255, 255, 0.4), transparent),
          radial-gradient(1.5px 1.5px at 90% 60%, rgba(255, 255, 255, 0.35), transparent),
          radial-gradient(1.5px 1.5px at 60% 85%, rgba(255, 255, 255, 0.4), transparent),
          radial-gradient(1.5px 1.5px at 20% 90%, rgba(255, 255, 255, 0.3), transparent);
      " />

    <!-- Lockup em texto/vetor, não bitmap: acompanha a cor do accent sazonal e
         não carrega um retângulo de fundo próprio (o PNG "with_bg" brigava
         visualmente com o gradiente do hero — 2 fundos escuros encostados). -->
    <div v-motion class="relative z-10 flex items-center gap-2.5" :initial="{ opacity: 0, y: -10 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }">
      <img src="../../../assets/icon_with_no-bg.png" alt="" class="h-24 w-24 object-cover   " />
      <div class="flex flex-col leading-none">
        <span class="font-display text-lg font-extrabold" style="
            background: linear-gradient(90deg, #fff 0%, #c4b5fd 55%, #7dd3fc 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          ">
          AnimeWeek
        </span>
        <span class="font-mono text-[9.5px] tracking-[0.2em] text-white/35 uppercase">
          Organize · Assista · Curta
        </span>
      </div>
    </div>

    <div class="relative z-10">
      <h2 v-motion class="font-display mb-3.5 text-[30px] leading-tight font-extrabold text-white"
        :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { duration: 500, delay: 100 } }">
        <slot />
      </h2>
      <p v-motion class="mb-7 max-w-[340px] text-[14.5px] leading-relaxed text-[#b4b8c6]"
        :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { duration: 500, delay: 180 } }">
        {{ subtitle }}
      </p>

      <div v-motion :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 500, delay: 260 } }">
        <PosterCarousel />
      </div>
    </div>

    <div v-motion
      class="relative z-10 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-[12.5px] text-[#d8dae3]"
      :initial="{ opacity: 0, y: 10 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 340 } }">
      <span>{{ meta.emoji }}</span> {{ meta.label }} {{ new Date().getFullYear() }} ·
      {{ meta.range }}
    </div>
  </div>
</template>
