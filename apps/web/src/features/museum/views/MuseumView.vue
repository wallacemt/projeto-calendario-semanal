<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import AppShell from '../../../components/AppShell.vue'
import { seasonMeta } from '../../../lib/season-meta'
import AddToCollectionModal from '../components/AddToCollectionModal.vue'
import EditWatchedModal from '../components/EditWatchedModal.vue'
import MuseumContextMenu from '../components/MuseumContextMenu.vue'
import { useMuseumStore } from '../store'
import type { WatchedAnimeDto } from '../api'

const museum = useMuseumStore()
onMounted(() => museum.fetchTrophies())

const addOpen = ref(false)
const search = ref('')
const filterTier = ref<'all' | 'S' | 'A' | 'B'>('all')

// Sem campo "tier" no backend — deriva da nota (1..10) na hora de exibir,
// mesma ideia do rating->tier do mockup original (design M8), só que
// recalibrado pra escala de 10 em vez de 5 estrelas.
const TIER_COLORS: Record<'S' | 'A' | 'B', string> = { S: '#FBBF24', A: '#A78BFA', B: '#5EEAD4' }
function tierOf(rating: number | null): 'S' | 'A' | 'B' {
  if (rating != null && rating >= 9) return 'S'
  if (rating != null && rating >= 7) return 'A'
  return 'B'
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })

// featured é resolvido no backend (pin manual em User.featuredWatchedAnimeId,
// ou o mais recente em modo auto — ver MuseumService.resolveFeaturedId).
const featured = computed(() => museum.trophies.find((t) => t.featured) ?? null)

function watchedWhenLabel(t: WatchedAnimeDto): string {
  if (t.watchedSeason && t.watchedYear) return `${seasonMeta[t.watchedSeason].label} ${t.watchedYear}`
  if (t.watchedYear) return String(t.watchedYear)
  return dateFormatter.format(new Date(t.completedAt))
}

// M8.1: right-click no card — fixar/desfixar destaque, editar, remover.
const contextMenu = ref<{ x: number; y: number; trophy: WatchedAnimeDto } | null>(null)
function onCardContextMenu(event: MouseEvent, trophy: WatchedAnimeDto) {
  contextMenu.value = { x: event.clientX, y: event.clientY, trophy }
}
const editingTrophy = ref<WatchedAnimeDto | null>(null)
function openEditFromMenu() {
  if (!contextMenu.value) return
  editingTrophy.value = contextMenu.value.trophy
  contextMenu.value = null
}
function toggleFeaturedFromMenu() {
  if (!contextMenu.value) return
  const { trophy } = contextMenu.value
  museum.setFeatured(trophy.featured ? null : trophy.id)
  contextMenu.value = null
}
function removeFromMenu() {
  if (!contextMenu.value) return
  museum.remove(contextMenu.value.trophy.id)
  contextMenu.value = null
}

const filteredTrophies = computed(() => {
  const q = search.value.trim().toLowerCase()
  return museum.trophies.filter((t) => {
    if (q && !t.anime.title.toLowerCase().includes(q)) return false
    if (filterTier.value !== 'all' && tierOf(t.rating) !== filterTier.value) return false
    return true
  })
})

const avgRating = computed(() => {
  const rated = museum.trophies.filter((t): t is WatchedAnimeDto & { rating: number } => t.rating != null)
  if (rated.length === 0) return null
  return Math.round((rated.reduce((sum, t) => sum + t.rating, 0) / rated.length) * 10) / 10
})

const periodLabel = computed(() => {
  if (museum.trophies.length === 0) return '—'
  const years = museum.trophies.map((t) => new Date(t.completedAt).getFullYear())
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? String(min) : `${min} – ${max}`
})

const sTierCount = computed(() => museum.trophies.filter((t) => tierOf(t.rating) === 'S').length)

const TIER_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'S', label: 'S-tier' },
  { id: 'A', label: 'A-tier' },
  { id: 'B', label: 'B-tier' },
] as const
</script>

<template>
  <AppShell title="Museu" subtitle="Sua vitrine de animes concluídos">
    <div class="flex items-center justify-end px-6 pt-5 sm:px-8">
      <button type="button"
        class="flex glass  items-center gap-2 rounded-[10px] px-4.5 py-2.5 text-[12.5px] font-bold text-white"
        style="background: var(--brand-primary); box-shadow: 0 10px 24px rgba(124, 92, 246, 0.3)"
        @click="addOpen = true">
        + Adicionar à coleção
      </button>
    </div>

    <div class="p-6 sm:p-8">
      <p v-if="museum.loading" class="py-16 text-center text-[13px] text-(--ink-text-faint)">Carregando...</p>

      <template v-else>
        <p v-if="museum.trophies.length === 0" class="py-16 text-center text-[13px] text-(--ink-text-faint)">
          Nenhum anime no museu ainda — marque um anime como assistido no calendário ou adicione direto aqui.
        </p>

        <template v-else>
          <!-- Vitrine central -->
          <div v-if="featured" class="mb-5.5 glass flex items-center gap-8 rounded-[22px] border p-7.5"
            style="border-color: rgba(255, 255, 255, 0.09); background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))">
            <div class="h-66 w-47.5 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
              <img v-if="featured.anime.imageUrl" :src="featured.anime.imageUrl" :alt="featured.anime.title"
                class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-2.5 font-mono text-[11px] tracking-wide" style="color: #c4b5fd">✨ OBRA EM DESTAQUE</div>
              <div class="font-display mb-2.5 text-[24px] font-extrabold text-white">{{ featured.anime.title }}</div>
              <div class="mb-4 flex flex-wrap items-center gap-4 text-[12.5px] text-(--ink-text-muted)">
                <span v-if="featured.anime.episodes">📺 Série · {{ featured.anime.episodes }} eps</span>
                <span>📅 Assistido em {{ watchedWhenLabel(featured) }}</span>
                <span v-if="featured.rating" style="color: #fbbf24">★ {{ featured.rating }}/10</span>
              </div>
              <div v-if="featured.comment"
                class="relative pl-5.5 text-[13.5px] leading-relaxed text-(--ink-text) italic">
                <span class="absolute -top-1 left-0 text-[22px] not-italic"
                  style="color: rgba(196, 181, 253, 0.5)">"</span>{{ featured.comment }}
              </div>
            </div>
          </div>

          <!-- Busca + filtros -->
          <div class="mb-5.5 flex flex-wrap items-center gap-2.5">
            <div class="flex h-10.5 flex-1 items-center gap-2.5 rounded-[11px] border px-4 glass"
              style="border-color: rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.035)">
              <Search :size="13" class="text-(--ink-text-faint)" />
              <input v-model="search" type="text"  placeholder="Buscar na coleção..."
                class="flex-1 bg-transparent text-[13px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)" />
            </div>
            <button v-for="f in TIER_FILTERS" :key="f.id" type="button"
              class="h-10.5 rounded-[11px] border px-4 text-[12.5px] font-semibold whitespace-nowrap glass" :style="filterTier === f.id
                ? { background: 'linear-gradient(135deg,#8B5CF6,#4F8EF7)', color: '#fff', borderColor: 'transparent' }
                : { color: '#9CA3B0', background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.09)' }"
              @click="filterTier = f.id">
              {{ f.label }}
            </button>
          </div>

          <!-- Tiles -->
          <div class="mb-6.5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="rounded-[14px] border border-white/8 bg-white/3.5 px-5 py-4.5 glass">
              <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Concluídos</div>
              <div class="font-display text-[26px] font-extrabold text-white">{{ museum.trophies.length }}</div>
            </div>
            <div class="rounded-[14px] border border-white/8 bg-white/3.5 px-5 py-4.5 glass">
              <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Nota média dada</div>
              <div class="font-display text-[26px] font-extrabold" style="color: #fbbf24">{{ avgRating ?? '—' }}</div>
            </div>
            <div class="rounded-[14px] border border-white/8 bg-white/3.5 px-5 py-4.5 glass">
              <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Período</div>
              <div class="font-display text-[20px] font-extrabold text-white">{{ periodLabel }}</div>
            </div>
            <div class="rounded-[14px] border border-white/8 bg-white/3.5 px-5 py-4.5 glass">
              <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Troféus S-tier</div>
              <div class="font-display text-[26px] font-extrabold" style="color: #a78bfa">{{ sTierCount }}</div>
            </div>
          </div>

          <!-- Grid de troféus -->
          <div class="grid grid-cols-2 gap-4.5 sm:grid-cols-3 lg:grid-cols-5">
            <div v-for="t in filteredTrophies" :key="t.id"
              class="group overflow-hidden rounded-2xl border border-white/9 bg-white/3.5 transition-transform hover:-translate-y-0.75 glass"
              @contextmenu.prevent="onCardContextMenu($event, t)">
              <div class="relative h-77.5">
                <img v-if="t.anime.imageUrl" :src="t.anime.imageUrl" :alt="t.anime.title"
                  class="h-full w-full object-cover" />
                <div v-else class="h-full w-full bg-white/5" />
                <div class="pointer-events-none absolute inset-0"
                  style="background: linear-gradient(to bottom, rgba(5,6,9,0.5) 0%, transparent 25%, transparent 70%, rgba(5,6,9,0.9) 100%)" />
                <div class="absolute top-2 left-2 flex items-center gap-1">
                  <div
                    class="font-display flex h-7.5 w-7.5 items-center justify-center rounded-lg text-[14px] font-extrabold"
                    :style="{ background: TIER_COLORS[tierOf(t.rating)], color: '#050609' }">
                    {{ tierOf(t.rating) }}
                  </div>
                  <span v-if="t.featured" title="Em destaque"
                    class="flex h-6 w-6 items-center justify-center rounded-md text-[12px]"
                    style="background: rgba(5, 6, 9, 0.6); color: #fbbf24">★</span>
                </div>
                <span v-if="t.rating" class="absolute top-2.5 right-2.5 text-[10.5px] font-bold"
                  style="color: #fbbf24">★ {{ t.rating }}</span>
                <div class="absolute right-2 bottom-2 left-2.5 line-clamp-2 text-[11.5px] font-bold text-white">
                  {{ t.anime.title }}
                </div>
              </div>
              <div class="flex items-center justify-between border-t border-white/5 px-2.75 py-2.5">
                <span class="text-[10px] text-(--ink-text-faint)">✓ {{ watchedWhenLabel(t) }}</span>
                <div class="flex items-center gap-1.5">
                  <span v-if="t.anime.episodes" class="text-[10px] text-(--ink-text-faint)">{{ t.anime.episodes }}
                    eps</span>
                  <button type="button" title="Remover do museu"
                    class="text-[10px] text-(--ink-text-faint) opacity-0 hover:text-red-400 group-hover:opacity-100"
                    @click="museum.remove(t.id)">✕</button>
                </div>
              </div>
            </div>
            <div v-if="filteredTrophies.length === 0"
              class="col-span-full py-10 text-center text-[12.5px] text-(--ink-text-faint)">
              Nenhuma obra encontrada na coleção.
            </div>
          </div>
        </template>
      </template>
    </div>

    <AddToCollectionModal v-if="addOpen" @close="addOpen = false" />

    <MuseumContextMenu v-if="contextMenu" :x="contextMenu.x" :y="contextMenu.y" :featured="contextMenu.trophy.featured"
      @edit="openEditFromMenu" @toggle-featured="toggleFeaturedFromMenu" @remove="removeFromMenu"
      @close="contextMenu = null" />

    <EditWatchedModal v-if="editingTrophy" :entry="editingTrophy" @close="editingTrophy = null" />
  </AppShell>
</template>
