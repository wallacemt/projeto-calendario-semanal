<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import AppShell from '../../../components/AppShell.vue'
import { useDebounce } from '../../../composables/useDebounce'
import type { AnimeFilter } from '../api'
import AnimeCard from '../components/AnimeCard.vue'
import AnimeCardSkeleton from '../components/AnimeCardSkeleton.vue'
import AnimeDetailPanel from '../components/AnimeDetailPanel.vue'
import { useDiscoverStore } from '../store'

const store = useDiscoverStore()

const input = ref('')
// 500ms — folga suficiente pra alguém digitar "attack on titan" inteiro sem
// disparar uma request por pausa entre palavras (400ms era curto demais pra
// digitação mais lenta). O que realmente evita resultado errado em tela não
// é o delay em si, é o requestId na store (ver fetchPage) — o debounce só
// reduz o número de requests, não garante ordem de chegada das respostas.
const debouncedInput = useDebounce(input, 500)
watch(debouncedInput, (value) => store.search(value))

// Enter busca na hora, sem esperar o debounce — o requestId da store já
// protege contra a resposta do debounce (se ainda estiver pendente) chegar
// depois e sobrescrever o resultado desta busca imediata.
function searchNow() {
  store.search(input.value)
}

const FILTERS: { value: AnimeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'tv', label: 'TV' },
  { value: 'movie', label: 'Filme' },
  { value: 'airing', label: 'Em exibição' },
  { value: 'top', label: 'Melhor avaliados' },
]

function clearSearch() {
  input.value = ''
  store.search('')
}

onMounted(async () => {
 await store.getSeasonNow();
})
</script>

<template>
  <AppShell title="Descobrir animes" subtitle="Busca via API · resultados em cache">
    <div class="flex h-full flex-col">
      <div class="flex-shrink-0 border-b px-8 pt-6 pb-4.5" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="mb-3.5 flex gap-3">
          <div class="flex h-11.5 flex-1 items-center gap-2.5 rounded-xl border px-4"
            style="border-color: rgba(139, 92, 246, 0.35); background: rgba(255, 255, 255, 0.04); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08)">
            <Search :size="16" class="text-(--ink-text-muted)" />
            <input v-model="input" type="text" placeholder="Buscar por título, gênero, temporada..."
              class="flex-1 bg-transparent text-sm text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)"
              @keyup.enter="searchNow" />
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <button v-for="f in FILTERS" :key="f.value" type="button"
            class="rounded-full px-3.5 py-1.75 text-[12.5px] font-semibold"
            :class="store.filter === f.value ? 'text-white' : 'border text-(--ink-text-muted)'" :style="store.filter === f.value
              ? { background: 'linear-gradient(135deg, #8b5cf6, #4f8ef7)' }
              : { borderColor: 'rgba(255,255,255,0.1)' }
              " @click="store.setFilter(f.value)">
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="relative flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-y-auto p-8">
          <div v-if="store.loading"
            class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimeCardSkeleton v-for="n in 10" :key="n" />
          </div>

          <div v-else-if="store.error && store.results.length === 0"
            class="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
            <div class="flex h-22 w-22 items-center justify-center rounded-3xl border text-3xl"
              style="background: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.25)">
              ⚠️
            </div>
            <div class="font-display text-[16.5px] font-bold text-white">Não foi possível buscar agora</div>
            <p class="max-w-85 text-[13px] leading-relaxed text-(--ink-text-faint)">{{ store.error }}</p>
          </div>

          <div v-else-if="store.results.length === 0 && !store.loading"
            class="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
            <div class="flex h-22 w-22 items-center justify-center rounded-3xl border text-3xl"
              style="background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.08)">
              😕
            </div>
            <div class="font-display text-[16.5px] font-bold text-white">Nenhum resultado encontrado</div>
            <p class="max-w-85 text-[13px] leading-relaxed text-(--ink-text-faint)">
              Não encontramos animes para "{{ store.query }}". Verifique a grafia ou tente outro termo.
            </p>
            <button type="button" class="rounded-[10px] border px-5 py-2.5 text-sm text-(--ink-text-muted)"
              style="border-color: rgba(255, 255, 255, 0.12)" @click="clearSearch">
              Limpar busca
            </button>
          </div>

          <template v-else>
            <div class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimeCard v-for="anime in store.results" :key="anime.malId" :anime="anime"
                :selected="store.selected?.malId === anime.malId" @select="store.select" />
            </div>

            <div v-if="store.hasNextPage || (store.error && store.results.length > 0)"
              class="flex flex-col items-center gap-2 pt-8">
              <p v-if="store.error" class="text-[12.5px] text-(--ink-text-faint)">{{ store.error }}</p>
              <button v-if="store.hasNextPage" type="button" :disabled="store.loading"
                class="rounded-[10px] border px-5 py-2.5 text-sm text-(--ink-text-muted) disabled:opacity-50"
                style="border-color: rgba(255, 255, 255, 0.12)" @click="store.loadMore">
                {{ store.loading ? 'Carregando...' : 'Carregar mais' }}
              </button>
              <p class="text-[11.5px] text-(--ink-text-faint)">
                Página {{ store.page }}{{ store.lastPage ? ` de ${store.lastPage}` : '' }}
              </p>
            </div>
          </template>
        </div>

        <AnimeDetailPanel v-if="store.selected" :anime="store.selected" @close="store.clearSelection" />
      </div>
    </div>
  </AppShell>
</template>
