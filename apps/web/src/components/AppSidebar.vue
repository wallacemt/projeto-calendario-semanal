<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { BarChart3, Calendar, Landmark, Palette, Search } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

// Sidebar recolhível/arrastável (design AnimeWeek Perfil.dc.html) — estado é
// só de UI (não Pinia): nada aqui sobrevive a um reload, nem precisa.
const OPEN_W = 244
const COLLAPSED_W = 84
// Abaixo do breakpoint `sm` do Tailwind: sidebar trava no rail compacto
// (só ícones) e o arraste manual desliga — não faz sentido arrastar uma
// borda de resize numa tela de celular.
const MOBILE_QUERY = '(max-width: 640px)'

const drag = reactive({ active: false, startX: 0, startOpen: true, offset: 0 })
const state = reactive({ open: true })

const isMobile = ref(false)
let mql: MediaQueryList | undefined
function onMobileChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}
onMounted(() => {
  mql = window.matchMedia(MOBILE_QUERY)
  isMobile.value = mql.matches
  mql.addEventListener('change', onMobileChange)
})
onUnmounted(() => mql?.removeEventListener('change', onMobileChange))

// Labels/nome só aparecem "aberto" E fora do modo mobile — no mobile o rail
// fica sempre compacto, independente do que o usuário arrastou antes.
const expanded = computed(() => state.open && !isMobile.value)

const width = computed(() => {
  if (isMobile.value) return COLLAPSED_W
  const start = drag.startOpen ? OPEN_W : COLLAPSED_W
  const raw = drag.active ? start + drag.offset : state.open ? OPEN_W : COLLAPSED_W
  return Math.round(Math.max(COLLAPSED_W - 10, Math.min(OPEN_W + 30, raw)))
})

function onGripDown(e: PointerEvent) {
  if (isMobile.value) return
  e.preventDefault()
  drag.active = true
  drag.startX = e.clientX
  drag.startOpen = state.open
  drag.offset = 0
  window.addEventListener('pointermove', onGripMove)
  window.addEventListener('pointerup', onGripUp)
}

function onGripMove(e: PointerEvent) {
  drag.offset = e.clientX - drag.startX
}

function onGripUp() {
  window.removeEventListener('pointermove', onGripMove)
  window.removeEventListener('pointerup', onGripUp)
  const start = drag.startOpen ? OPEN_W : COLLAPSED_W
  state.open = start + drag.offset > (OPEN_W + COLLAPSED_W) / 2
  drag.active = false
  drag.offset = 0
}

const auth = useAuthStore()
const route = useRoute()

// "Descobrir"/"Museu"/"Estatísticas"/"Temas" ainda não têm rota (M6/M8/M10/M7)
// — mostrados desabilitados em vez de linkar para uma tela que não existe.
const navItems = [
  { icon: Calendar, label: 'Calendário', to: { name: 'home' } },
  { icon: Search, label: 'Descobrir', to: null },
  { icon: Landmark, label: 'Museu', to: null },
  { icon: BarChart3, label: 'Estatísticas', to: null },
  { icon: Palette, label: 'Temas', to: null },
] as const

const initial = computed(() => auth.user?.username?.[0]?.toUpperCase() ?? '?')
</script>

<template>
  <div
    class="relative flex flex-shrink-0 flex-col gap-1 overflow-hidden py-7 px-4"
    :style="{
      width: `${width}px`,
      transition: drag.active ? 'none' : 'width 0.28s cubic-bezier(.4,0,.2,1)',
      background:
        'radial-gradient(ellipse 260px 220px at 15% 0%, rgba(139,92,246,0.24), transparent 60%), radial-gradient(ellipse 240px 280px at 100% 90%, rgba(56,189,248,0.2), transparent 65%), #0a0b12',
      boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.06), 14px 0 50px rgba(79,142,247,0.12)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }"
  >
    <div
      v-if="!isMobile"
      class="absolute top-0 right-0 z-10 flex h-full w-3.5 cursor-col-resize items-center justify-center hover:bg-white/5"
      @pointerdown="onGripDown"
    >
      <div class="h-9 w-0.75 rounded-full bg-white/20" />
    </div>

    <RouterLink :to="{ name: 'home' }" class="relative z-[2] flex items-center gap-2.5 overflow-hidden px-1.5 pb-6">
      <img src="../assets/icon_with_bg.png" alt="" class="h-12.5 w-12.5 flex-shrink-0 object-contain rounded-2xl" />
      <div v-if="expanded" class="overflow-hidden whitespace-nowrap">
        <div class="font-display text-base font-extrabold text-white">AnimeWeek</div>
        <div class="text-[10.5px] text-(--ink-text-faint)">Organize seus animes.</div>
      </div>
    </RouterLink>

    <component
      :is="item.to ? RouterLink : 'div'"
      v-for="item in navItems"
      :key="item.label"
      v-bind="item.to ? { to: item.to } : {}"
      class="relative z-[2] flex items-center gap-2.5 overflow-hidden rounded-[10px] px-2.5 py-2.75 text-sm whitespace-nowrap"
      :class="
        item.to
          ? route.name === item.to.name
            ? 'bg-white/8 text-(--ink-text)'
            : 'text-(--ink-text-muted) hover:bg-white/6 hover:text-(--ink-text)'
          : 'cursor-not-allowed text-(--ink-text-faint)/60'
      "
    >
      <component :is="item.icon" :size="17" :stroke-width="2" />
      <span v-if="expanded">{{ item.label }}</span>
    </component>

    <div class="relative z-[2] flex-1" />

    <RouterLink
      :to="{ name: 'profile' }"
      class="relative z-[2] flex items-center gap-2.5 overflow-hidden rounded-xl border px-2.5 py-3 whitespace-nowrap"
      :style="{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.28), rgba(79,142,247,0.28))',
        borderColor: 'rgba(139,92,246,0.4)',
      }"
    >
      <img
        v-if="auth.user?.avatarUrl"
        :src="auth.user.avatarUrl"
        alt=""
        class="lg:h-8.5 lg:w-8.5   rounded-full object-cover"
      />
      <div
        v-else
        class="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
        style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)"
      >
        {{ initial }}
      </div>
      <div v-if="expanded">
        <div class="text-[13px] font-semibold text-(--ink-text)">{{ auth.user?.username }}</div>
        <div class="text-[11px]" style="color: #ddd6fe">Perfil</div>
      </div>
    </RouterLink>
  </div>
</template>
