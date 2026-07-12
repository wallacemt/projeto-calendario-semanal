<script setup lang="ts">
// Stack de "capas" mockadas — sem arte real ainda (entra na M3, integração
// Jikan). Cada item só define geometria; a cor vem dos tokens --season-accent
// já ativos via [data-season] (tokens.css), então trocar de estação já
// re-tinge o stack inteiro sem tocar aqui.
const posters = [
  { w: 104, h: 144, rotate: -34, offset: 26, margin: -30, z: 1, delay: '0s', tone: 1 },
  { w: 118, h: 164, rotate: -17, offset: 8, margin: -26, z: 2, delay: '0.15s', tone: 2 },
  { w: 132, h: 184, rotate: 0, offset: -14, margin: 0, z: 3, delay: '0.3s', tone: 1 },
  { w: 118, h: 164, rotate: 17, offset: 8, margin: -26, z: 2, delay: '0.45s', tone: 2 },
  { w: 104, h: 144, rotate: 34, offset: 26, margin: -30, z: 1, delay: '0.6s', tone: 1 },
] as const

const postersUrl = [
  "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/auth-poster/819mqGDLU1L._AC_UF1000,1000_QL80_.jpg",
  "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/auth-poster/71TEME+il+L._AC_UF1000,1000_QL80_.jpg",
  "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/auth-poster/uiIB9ctqZFbfRXXimtpmZb5dusi.webp",
  "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/auth-poster/2d55f88858149035832c690f512844ae.jpg",
  "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/auth-poster/Anime_JJK_poster_01.webp",
]
</script>

<template>
  <div class="flex h-52.5 items-end" role="presentation">
    <div v-for="(poster, i) in posters" :key="i"
      class="animate-float relative flex items-center justify-center rounded-lg border border-white/10 shadow-[0_14px_28px_rgba(0,0,0,0.42)]"
      :style="{
        width: `${poster.w}px`,
        height: `${poster.h}px`,
        top: `${poster.offset}px`,
        marginLeft: i === 0 ? undefined : `${poster.margin}px`,
        transform: `rotate(${poster.rotate}deg)`,
        transformOrigin: 'bottom center',
        zIndex: poster.z,
        animationDelay: poster.delay,
        background:
          poster.tone === 1
            ? `repeating-linear-gradient(45deg, color-mix(in srgb, var(--season-accent-1) 28%, transparent), color-mix(in srgb, var(--season-accent-1) 28%, transparent) 6px, rgba(255,255,255,0.03) 6px, rgba(255,255,255,0.03) 12px)`
            : `repeating-linear-gradient(45deg, color-mix(in srgb, var(--season-accent-2) 26%, transparent), color-mix(in srgb, var(--season-accent-2) 26%, transparent) 6px, rgba(255,255,255,0.03) 6px, rgba(255,255,255,0.03) 12px)`,
      }">
      <img v-if="postersUrl[i]" :src="postersUrl[i]" alt="" class="h-full w-full rounded-lg object-cover" />
    </div>
  </div>
</template>
