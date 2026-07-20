<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Play, Search } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { AnimeFullDto } from '@aniweek/shared'
import AppShell from '../../../components/AppShell.vue'
import { useDebounce } from '../../../composables/useDebounce'
import { HttpError } from '../../../lib/http'
import { discoverApi } from '../api'
import { useDiscoverStore } from '../store'
import { useThemeStore } from "../../../stores/theme.ts"
import { Season } from '@aniweek/shared'

const route = useRoute()
const router = useRouter()
const store = useDiscoverStore()

const seasonStore = useThemeStore()
const anime = ref<AnimeFullDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const herosBg: { id: Season; url: string }[] = [{
  id: Season.SUMMER,
  url: "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/anime-details-bg/summer.jpg"
}, {
  id: Season.FALL,
  url: "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/anime-details-bg/authum.png"
}, {
  id: Season.WINTER,
  url: "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/anime-details-bg/winter.png"
}, {
  id: Season.SPRING,
  url: "https://djitwkagdqgbhanenonk.supabase.co/storage/v1/object/public/aniweek/anime-details-bg/spring.png"
}]
const seasonHeroBg = ref<{ id: string; url: string } | null>(herosBg[0])

async function load() {
  const malId = Number(route.params.malId)
  loading.value = true
  error.value = null
  anime.value = null
  try {
    anime.value = { ...await discoverApi.fullDetail(malId), relations: [] }
    seasonHeroBg.value = herosBg.find(bg => bg.id === seasonStore.season) ?? herosBg[0]
  } catch (err) {
    error.value = err instanceof HttpError ? err.message : 'Erro ao carregar o anime'
  } finally {
    loading.value = false
  }
}

// Detalhe de um anime muda quando o usuário navega de /discover/20 pra
// /discover/21 sem sair do componente (RouterLink entre dois cards, ou pela
// rail "Descobrir" desta própria página) — o Vue reaproveita a instância,
// então precisa observar params.malId em vez de só carregar no onMounted.
watch(() => route.params.malId, load)

onMounted(() => {
  void load()
  // Rail "Descobrir" (mockup 3c): reaproveita o estado já existente na store
  // em vez de duplicar busca — se o usuário chegou aqui vindo de /discover,
  // store.results já tem a busca/temporada dele. Só busca a temporada atual
  // como fallback quando a store está mesmo vazia (ex.: link direto pra
  // /discover/:malId sem passar pela tela de busca antes).
  if (store.results.length === 0) void store.getSeasonNow()
})

// Rail de busca rápida: mesmo composable + mesma action da tela de busca
// (useDebounce + store.search) — não é uma busca paralela, é a mesma.
const railQuery = ref('')
const debouncedRailQuery = useDebounce(railQuery, 500)
watch(debouncedRailQuery, (value) => store.search(value))

const COMPACT_FORMATTER = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
function formatCompact(value: number | null): string {
  return value === null ? '—' : COMPACT_FORMATTER.format(value)
}

// Jikan retorna `season` em minúsculo ("fall") — combinado com `year` vira
// "Fall 2023" (rótulo "Temporada" do mockup 3c).
function seasonLabel(a: AnimeFullDto): string {
  if (!a.season && !a.year) return '—'
  const season = a.season ? a.season[0].toUpperCase() + a.season.slice(1) : ''
  return [season, a.year].filter(Boolean).join(' ')
}

const stats = computed(() => {
  if (!anime.value) return []
  const a = anime.value
  return [
    { label: 'Score', value: a.score?.toFixed(2) ?? '—', accent: '#fbbf24' },
    { label: 'Ranked', value: a.rank ? `#${a.rank}` : '—' },
    { label: 'Popularidade', value: a.popularity ? `#${a.popularity}` : '—' },
    { label: 'Membros', value: formatCompact(a.members) },
    { label: 'Favoritos', value: formatCompact(a.favorites) },
  ]
})

const infoRows = computed(() => {
  if (!anime.value) return []
  const a = anime.value
  const rows = [
    { label: 'Tipo', value: a.type ?? '—' },
    { label: 'Episódios', value: a.episodes ?? '—' },
    { label: 'Exibido', value: a.aired ?? '—' },
    { label: 'Temporada', value: seasonLabel(a) },
    { label: 'Duração', value: a.duration ?? '—' },
    { label: 'Classificação', value: a.rating ?? '—' },
    { label: 'Fonte', value: a.source ?? '—' },
    { label: 'Estúdio', value: a.studios.join(', ') || '—' },
    { label: 'Produtoras', value: a.producers.join(', ') || '—' },
    { label: 'Transmissão', value: a.broadcast ?? '—' },
  ]
  if (a.licensors.length) rows.push({ label: 'Licenciadoras', value: a.licensors.join(', ') })
  return rows
})

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Extra']
</script>

<template>
  <AppShell title="Detalhe do anime" subtitle="Todas as informações disponíveis via Jikan">
    <div v-if="loading" class="mx-auto max-w-6xl p-8">
      <div class="mb-6 h-70 animate-pulse rounded-2xl border border-white/8 bg-white/10" />
      <div class="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        <div v-for="n in 5" :key="n" class="h-19 animate-pulse rounded-xl border border-white/8 bg-white/10" />
      </div>
      <div class="mb-3 h-4 w-32 animate-pulse rounded bg-white/15" />
      <div class="mb-2 h-3 w-full animate-pulse rounded bg-white/10" />
      <div class="mb-2 h-3 w-11/12 animate-pulse rounded bg-white/10" />
      <div class="h-3 w-4/5 animate-pulse rounded bg-white/10" />
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div class="font-display text-[16.5px] font-bold text-white">Não foi possível carregar</div>
      <p class="max-w-85 text-[13px] text-(--ink-text-faint)">{{ error }}</p>
      <button type="button" class="rounded-[10px] border px-5 py-2.5 text-sm text-(--ink-text-muted)"
        style="border-color: rgba(255, 255, 255, 0.12)" @click="router.back()">
        Voltar
      </button>
    </div>

    <div v-else-if="anime" class="mx-auto max-w-6xl p-8">
      <button type="button" class="mb-5 flex items-center gap-1.5 text-sm text-(--ink-text-muted) hover:text-white"
        @click="router.back()">
        <ArrowLeft :size="15" />
        Voltar
      </button>

      <!-- Hero: pôster real sobreposto no canto inferior-esquerdo (mockup 3c) —
           usa a própria capa desfocada como backdrop em vez do gradiente
           abstrato do mockup, já que aqui temos arte real (não placeholder). -->
      <div class="relative mb-11 h-70 overflow-hidden rounded-2xl bg-white/5">
        <img v-if="seasonHeroBg" :src="seasonHeroBg.url" :alt="anime.title"
          class="absolute inset-0 h-full w-full object-cover opacity-90 blur-xs  " />
        <div class="absolute inset-0"
          style="background: linear-gradient(90deg, rgba(5, 6, 9, 0.35) 0%, rgba(5, 6, 9, 0.94) 100%)" />
        <div class="absolute bottom-0 left-8 flex items-end gap-6 pb-6">
          <div class="-mb-6 h-53 w-37.5 flex-shrink-0 overflow-hidden rounded-[14px] border border-white/15 shadow-xl">
            <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.title" class="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-7 lg:flex-row">
        <!-- Coluna principal -->
        <div class="flex min-w-0 flex-1 flex-col gap-5.5">
          <div>
            <div v-if="anime.status" class="mb-2">
              <span class="rounded-full border px-2.75 py-1 text-[11px] font-semibold"
                style="background: rgba(94, 234, 212, 0.12); border-color: rgba(94, 234, 212, 0.3); color: #5eead4">
                {{ anime.status }}
              </span>
            </div>
            <h2 class="font-display text-[28px] leading-tight font-extrabold text-white">{{ anime.title }}</h2>
            <div class="mt-1.5 text-[13px] text-(--ink-text-muted)">
              {{ [anime.titleJapanese, anime.type, anime.studios[0]].filter(Boolean).join(' · ') }}
            </div>
          </div>

          <a v-if="anime.trailerUrl" :href="anime.trailerUrl" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold text-white"
            style="border-color: rgba(139, 92, 246, 0.4); background: rgba(139, 92, 246, 0.12)">
            <Play :size="16" />
            Assistir trailer
          </a>

          <div class="grid grid-cols-3 gap-3 sm:grid-cols-5">
            <div v-for="stat in stats" :key="stat.label" class="rounded-xl border p-3 text-center"
              style="background: rgba(255, 255, 255, 0.035); border-color: rgba(255, 255, 255, 0.08)">
              <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">{{ stat.label }}</div>
              <div class="font-display text-[1em] font-extrabold "
                :style="stat.accent ? { color: stat.accent } : { color: '#fff' }">
                {{ stat.value }}
              </div>
            </div>
          </div>

          <div v-if="anime.synopsis">
            <div class="mb-2 text-[13px] font-bold text-white">Sinopse</div>
            <p class="text-[13px] leading-relaxed text-(--ink-text-muted)">{{ anime.synopsis }}</p>
          </div>

          <div v-if="anime.background">
            <div class="mb-2 text-[13px] font-bold text-white">Curiosidades</div>
            <p class="text-[13px] leading-relaxed text-(--ink-text-muted)">{{ anime.background }}</p>
          </div>

          <div>
            <div class="mb-2.5 text-[14px] font-bold text-white">Informações</div>
            <div class="grid grid-cols-1 gap-x-7 gap-y-3 text-[13px] sm:grid-cols-2">
              <div v-for="row in infoRows" :key="row.label" class="flex justify-between border-b pb-2 gap-4"
                style="border-color: rgba(255, 255, 255, 0.06)">
                <span class="text-(--ink-text-faint)">{{ row.label }}</span>
                <span class="text-(--ink-text) ">{{ row.value }}</span>
              </div>
            </div>
          </div>

          <div v-if="anime.genres.length" class="flex flex-wrap gap-1.5">
            <span v-for="genre in anime.genres" :key="genre" class="rounded-full border px-2.75 py-1 text-[11px]"
              style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); color: #c4b5fd">
              {{ genre }}
            </span>
          </div>

          <div class="h-px" style="background: rgba(255, 255, 255, 0.06)" />

          <div>
            <div class="mb-3 text-[14px] font-bold text-white">Adicionar ao calendário</div>
            <div class="mb-3.5 grid max-w-125 grid-cols-4 gap-2">
              <div v-for="day in WEEKDAYS" :key="day" class="rounded-[9px] border py-2.25 text-center text-xs"
                :class="day === 'Extra' ? 'border-dashed text-(--ink-text-faint)' : 'text-(--ink-text-faint)'"
                style="border-color: rgba(255, 255, 255, 0.1)">
                {{ day }}
              </div>
            </div>
            <!-- Calendar/CalendarEntry chegam na M4 (ADR-03) — mesmo placeholder
                 desabilitado do painel lateral (AnimeDetailPanel.vue), só que
                 replicado aqui pra consistência visual entre os dois lugares. -->
            <button type="button" disabled
              class="flex h-12 w-full max-w-70 cursor-not-allowed items-center justify-center gap-2 rounded-xl text-sm font-bold text-white opacity-50"
              style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)">
              Disponível no M4 — Calendário
            </button>
          </div>

          <div v-if="anime.relations.length">
            <div class="mb-2.5 text-[13px] font-bold text-white">Relações com outros animes</div>
            <div class="flex flex-col gap-2.5">
              <div v-for="group in anime.relations" :key="group.relation">
                <div class="mb-1 text-[11px] text-(--ink-text-faint)">{{ group.relation }}</div>
                <div class="flex flex-wrap gap-1.5">
                  <a v-for="entry in group.entries" :key="entry.malId"
                    :href="`https://myanimelist.net/${entry.type}/${entry.malId}`" target="_blank"
                    rel="noopener noreferrer"
                    class="rounded-full border px-2.75 py-1 text-[11px] text-white hover:border-white/30"
                    style="background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.12)">
                    {{ entry.name }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rail "Descobrir" (mockup 3c) — mesma store/composable da tela de
             busca, nunca uma busca paralela. -->
        <aside class="flex w-full flex-shrink-0 flex-col gap-3.5 lg:w-75">
          <div class="flex items-center justify-between">
            <div class="text-[13px] font-bold text-white">Descobrir</div>
            <RouterLink :to="{ name: 'discover' }" class="text-[11.5px]">ver tudo</RouterLink>
          </div>
          <div class="flex h-9.5 items-center gap-2 rounded-[10px] border px-3"
            style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)">
            <Search :size="13" class="text-(--ink-text-faint)" />
            <input v-model="railQuery" type="text" placeholder="Buscar..."
              class="flex-1 bg-transparent text-xs text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)" />
          </div>

          <div class="flex flex-col gap-2.5">
            <p v-if="store.results.length === 0" class="text-[11.5px] text-(--ink-text-faint)">Nenhum resultado ainda.
            </p>
            <RouterLink v-for="result in store.results.slice(0, 8)" :key="result.malId"
              :to="{ name: 'anime-detail', params: { malId: result.malId } }"
              class="flex gap-3 rounded-xl border border-transparent p-2"
              :class="result.malId === anime.malId ? 'border-(--brand-secondary)/35 bg-(--brand-secondary)/10' : 'hover:bg-white/4'">
              <div class="h-18.5 w-13 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                <img v-if="result.imageUrl" :src="result.imageUrl" :alt="result.title"
                  class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0">
                <div class="truncate text-xs font-bold text-white">{{ result.title }}</div>
                <div class="mt-0.5 text-[10.5px] text-(--ink-text-faint)">
                  {{ [result.type, result.episodes ? `${result.episodes} eps` : null].filter(Boolean).join(' · ') }}
                </div>
                <div v-if="result.score" class="mt-0.5 text-[10.5px]" style="color: #fbbf24">★ {{
                  result.score.toFixed(1) }}</div>
              </div>
            </RouterLink>
          </div>
        </aside>
      </div>
    </div>
  </AppShell>
</template>
