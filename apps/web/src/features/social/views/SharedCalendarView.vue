<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Season, type Weekday } from '@aniweek/shared'
import { HttpError } from '../../../lib/http'
import { useAuthStore } from '../../../stores/auth'
import { useThemeStore } from '../../../stores/theme'
import { router } from '../../../router'
import { seasonMeta } from '../../../lib/season-meta'
import { WEEKDAY_META, WEEKDAY_ORDER } from '../../calendar/weekday-meta'
import SharedEntryCard from '../components/SharedEntryCard.vue'
import { sharingApi, socialApi, type PublicCalendarBoard } from '../api'

const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()

const board = ref<PublicCalendarBoard | null>(null)
const state = ref<'loading' | 'ready' | 'invalid'>('loading')
// Preenchido só quando logado (ver onMounted) — visitante anônimo nunca sabe
// "já reagi", já que reagir/ler exige conta (mesma regra do CommentsModal).
const myReactedIds = ref<Set<string>>(new Set())

// Mesmo bg-image da estação do CALENDÁRIO carregado (não a do visitante) —
// ver onUnmounted pra como isso é revertido ao sair da página.
let previousSeason: Season | null = null
// <title> da aba/link também identifica o dono (RF-11 — "de quem é esse
// calendário?" vale pra fora do app também: link colado num chat, aba
// aberta, etc). Restaurado no onUnmounted pelo mesmo motivo do season.
const previousTitle = document.title

// Mesma paleta hasheada por username usada em SocialView/UserProfileView —
// avatar sem foto precisa de uma cor estável, não escolhida à toa.
const AVATAR_COLORS = [
  'linear-gradient(135deg,#8B5CF6,#4F8EF7)',
  'linear-gradient(135deg,#F59E0B,#F97316)',
  'linear-gradient(135deg,#EC4899,#F472B6)',
  'linear-gradient(135deg,#5EEAD4,#2DD4BF)',
  'linear-gradient(135deg,#4F8EF7,#7DD3FC)',
]
function avatarColor(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Mesma UI accordion da tela de verdade (CalendarView), só sem
// VueDraggable/menu de contexto/modais — quem vê pelo link não edita nada,
// só clica pra expandir o dia, igual ao app.
const DAY_DEFS = WEEKDAY_ORDER.map((key) => ({ key, ...WEEKDAY_META[key] }))

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
function currentWeekMonday(): Date {
  const now = new Date()
  const day = now.getDay() // 0=dom..6=sáb
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  return monday
}
const weekDates = (() => {
  const monday = currentWeekMonday()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return dateFormatter.format(d)
  })
})()

function todayKey(): Weekday {
  const day = new Date().getDay() // 0=dom..6=sáb — mesmo índice de WEEKDAY_ORDER (começa em SUN)
  return DAY_DEFS[day].key
}
const expandedDay = ref<Weekday>(todayKey())

const days = computed(() =>
  DAY_DEFS.map((d, i) => ({
    ...d,
    date: d.isExtra ? 'Backlog' : weekDates[i],
    entries: board.value?.entries[d.key] ?? [],
    isExpanded: d.key === expandedDay.value,
  })),
)
const totalEntries = computed(() => days.value.reduce((sum, d) => sum + d.entries.length, 0))

onMounted(async () => {
  const token = route.params.token as string
  try {
    board.value = await sharingApi.publicBoard(token)
    state.value = 'ready'
    previousSeason = theme.season
    theme.setSeason(board.value.season)
    document.title = `Calendário de @${board.value.owner.username} · AnimeWeek`
  } catch (err) {
    if (!(err instanceof HttpError)) throw err
    state.value = 'invalid'
    // Verificação + redirecionamento: link inválido/desativado não deixa a
    // pessoa presa numa tela vazia — manda pra login (se ela nem tem sessão)
    // ou pro próprio calendário (se já está logada).
    setTimeout(() => {
      router.push(auth.isAuthenticated ? { name: 'home' } : { name: 'login' })
    }, 3000)
    return
  }

  // Fora do try acima de propósito: se isso falhar (ex.: token expirando
  // nesse instante), o board carregado continua válido — só perde o estado
  // "já reagi" nos corações, não vira uma tela de "link inválido" à toa.
  if (auth.isAuthenticated && board.value) {
    const allIds = Object.values(board.value.entries).flatMap((day) => day.map((e) => e.id))
    try {
      myReactedIds.value = new Set(await socialApi.myReactions(allIds))
    } catch (err) {
      if (!(err instanceof HttpError)) throw err
    }
  }
})

onUnmounted(() => {
  document.title = previousTitle
  if (!previousSeason) return
  theme.season = previousSeason
  theme.applyActiveTheme(theme.activeTheme)
})
</script>

<template>
  <!-- Sem bg sólido aqui de propósito (mesma nota do AppShell): o body (M7,
       style.css) já pinta --season-bg-image + um gradiente escuro por cima
       — é o que garante contraste pro texto claro mesmo nas estações com
       foto clara (ex.: Summer). Um bg sólido aqui cobriria essa imagem por
       completo (foi exatamente o bug anterior desta tela). -->
  <div class="flex h-screen flex-col text-(--ink-text)">
    <div v-if="state === 'loading'" class="flex flex-1 items-center justify-center text-[13px] text-(--ink-text-faint)">
      Carregando calendário...
    </div>

    <div v-else-if="state === 'invalid'" class="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <div class="font-display text-[18px] font-bold text-white">Link inválido ou desativado</div>
      <p class="text-[13px] text-(--ink-text-faint)">Redirecionando você em instantes...</p>
    </div>

    <template v-else-if="board">
      <div class="glass glass-strong flex flex-shrink-0 items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3.5 sm:px-8">
        <div class="flex min-w-0 items-center gap-3.5">
          <img v-if="board.owner.avatarUrl" :src="board.owner.avatarUrl" alt=""
            class="h-10.5 w-10.5 flex-shrink-0 rounded-full object-cover ring-2 ring-white/10" />
          <div v-else
            class="flex h-10.5 w-10.5 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white ring-2 ring-white/10"
            :style="{ background: avatarColor(board.owner.username) }">
            {{ board.owner.username[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0">
            <div class="font-mono text-[10px] tracking-wide text-(--brand-secondary)">CALENDÁRIO COMPARTILHADO · SOMENTE VISUALIZAÇÃO</div>
            <div class="font-display truncate text-[16px] font-extrabold text-white">
              @{{ board.owner.username }}
            </div>
            <div class="text-[11.5px] text-(--ink-text-faint)">
              {{ seasonMeta[board.season].emoji }} {{ seasonMeta[board.season].label }} {{ board.year }} · {{ totalEntries }} animes
            </div>
          </div>
        </div>
        <RouterLink :to="{ name: auth.isAuthenticated ? 'home' : 'login' }"
          class="glass flex-shrink-0 rounded-[10px] px-4 py-2.5 text-[12.5px] font-semibold text-(--ink-text-muted) hover:text-white">
          {{ auth.isAuthenticated ? 'Ir pro meu calendário' : 'Entrar no AnimeWeek' }}
        </RouterLink>
      </div>

      <div class="flex flex-1 gap-2 overflow-x-auto overflow-y-hidden p-3 sm:gap-3 sm:p-6">
        <div v-for="day in days" :key="day.key" class="relative flex flex-col overflow-hidden rounded-[14px]" :style="{
          flex: day.isExpanded ? '4 1 clamp(260px, 88vw, 420px)' : '0 0 clamp(2.75rem, 8vw, 4.5rem)',
          minWidth: day.isExpanded ? 'min(340px, 88vw)' : 'clamp(2.75rem, 8vw, 4.5rem)',
          cursor: day.isExpanded ? 'default' : 'pointer',
          transition:
            'flex-grow .45s cubic-bezier(.4,0,.2,1), flex-basis .45s cubic-bezier(.4,0,.2,1), min-width .45s cubic-bezier(.4,0,.2,1)',
        }" @click="!day.isExpanded && (expandedDay = day.key)">
          <!-- Expandido: dia atual (ou o último clicado) -->
          <div v-if="day.isExpanded" class="flex h-full flex-col gap-2.5 overflow-auto max-h-full rounded-[14px] p-3.5">
            <div class="flex items-center justify-between px-0.5">
              <div>
                <div class="font-mono text-[11px] font-bold tracking-wide" :style="{ color: day.isExtra ? '#FBBF24' : '#B4B8C6' }">
                  {{ day.short }}
                </div>
                <div class="mt-0.5 text-[10px] text-(--ink-text-faint)">{{ day.date }}</div>
              </div>
              <div class="flex h-5 w-5 items-center justify-center rounded-md text-[10.5px] font-bold text-(--ink-text-muted)"
                style="background: rgba(255, 255, 255, 0.06)">
                {{ day.entries.length }}
              </div>
            </div>

            <div class="grid flex-1 grid-cols-1 content-start gap-2.5 pb-1 sm:grid-cols-2 lg:grid-cols-4">
              <SharedEntryCard v-for="entry in day.entries" :key="entry.id" :entry="entry"
                :can-interact="auth.isAuthenticated" :reacted-by-me="myReactedIds.has(entry.id)" />
              <p v-if="day.entries.length === 0" class="col-span-full pt-2 text-[11px] text-(--ink-text-faint)">Vazio</p>
            </div>
          </div>

          <!-- Colapsado: só a faixa com contagem + label vertical, clique expande -->
          <div v-else class="glass flex h-full flex-col items-center gap-3.5 rounded-[14px] py-4 hover:border-(--brand-secondary)/35 hover:bg-(--brand-secondary)/8">
            <div class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-(--ink-text-muted)"
              style="background: rgba(255, 255, 255, 0.06)">
              {{ day.entries.length }}
            </div>
            <div class="font-mono text-[11.5px] font-bold tracking-wider whitespace-nowrap"
              :style="{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: day.isExtra ? '#FBBF24' : '#B4B8C6' }">
              {{ day.short }} · {{ day.date }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
