<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Maximize2, Minimize2, SquareArrowOutUpRight, X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { AnimeDto } from '@aniweek/shared'
import { useCalendarSlot } from '../../../composables/useCalendarSlot'
import { WEEKDAY_META, WEEKDAY_ORDER } from '../../calendar/weekday-meta'

const props = defineProps<{ anime: AnimeDto }>()
defineEmits<{ close: [] }>()

// Estado só do painel (não vai pra store): cada vez que o painel reabre pra
// outro anime ele é recriado via v-if no pai, então o ref já volta pro
// default sozinho — não precisa de reset manual.
const expanded = ref(false)

const malId = computed(() => props.anime.malId)
const { entry: calendarEntry, pending: savingDay, setWeekday } = useCalendarSlot(malId)
</script>

<template>
  <!-- Backdrop cobrindo a viewport inteira (não só a área de resultados) —
       mesmo padrão de todo modal do app (ver EditEntryModal/AddToCollectionModal
       etc.): fixed inset-0 + bg-black/60 + click.self fecha. Antes o painel
       vivia "absolute" dentro do container do Discover, então sidebar/topbar
       ficavam de fora do destaque — agora ele sobrepõe tudo de verdade. -->
  <div class="fixed inset-0 z-50 flex bg-black/60" @click.self="$emit('close')">
    <div
      class="ml-auto flex h-full flex-col overflow-y-auto border-l transition-[width] duration-300 ease-out"
      :class="expanded ? 'w-full' : 'w-full xl:w-105'"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.08); box-shadow: -24px 0 48px -16px rgba(0, 0, 0, 0.55)"
    >
      <div class="relative h-65 flex-shrink-0 bg-white/5">
        <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.title" class="h-full w-full object-cover" />
        <div class="absolute inset-0" style="background: linear-gradient(180deg, transparent 40%, #0a0b12 100%)" />
        <div class="absolute top-4 right-4 flex gap-2">
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-[9px] border"
            style="background: rgba(5, 6, 9, 0.6); border-color: rgba(255, 255, 255, 0.1)"
            :title="expanded ? 'Recolher' : 'Expandir'" @click="expanded = !expanded">
            <Minimize2 v-if="expanded" :size="15" />
            <Maximize2 v-else :size="15" />
          </button>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-[9px] border"
            style="background: rgba(5, 6, 9, 0.6); border-color: rgba(255, 255, 255, 0.1)" title="Fechar"
            @click="$emit('close')">
            <X :size="15" />
          </button>
        </div>
        <div class="absolute right-5 bottom-4 left-5">
          <div class="font-display text-[21px] leading-tight font-extrabold text-white">{{ anime.title }}</div>
          <div v-if="anime.type || anime.year" class="mt-1 text-[12px] text-(--ink-text-faint)">
            {{ [anime.type, anime.year].filter(Boolean).join(' · ') }}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-5 p-6" :class="expanded ? 'mx-auto w-full max-w-2xl' : ''">
        <div class="flex gap-2.5">
          <div class="glass flex-1 rounded-xl p-3 text-center">
            <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">Nota</div>
            <div class="font-display text-[17px] font-extrabold" style="color: #fbbf24">
              ★ {{ anime.score?.toFixed(1) ?? '—' }}
            </div>
          </div>
          <div class="glass flex-1 rounded-xl p-3 text-center">
            <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">Episódios</div>
            <div class="font-display text-[17px] font-extrabold text-white">{{ anime.episodes ?? '—' }}</div>
          </div>
          <div class="glass flex-1 rounded-xl p-3 text-center">
            <div class="mb-1 text-[10.5px] text-(--ink-text-faint)">Status</div>
            <div class="font-display text-[13px] font-bold" style="color: #5eead4">{{ anime.status ?? '—' }}</div>
          </div>
        </div>

        <RouterLink :to="{ name: 'anime-detail', params: { malId: anime.malId } }"
          class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold text-white"
          style="border-color: rgba(139, 92, 246, 0.4); background: rgba(139, 92, 246, 0.12)">
          Ver detalhes completos
          <SquareArrowOutUpRight :size="14" />
        </RouterLink>

        <div v-if="anime.genres.length" class="flex flex-wrap gap-1.5">
          <span v-for="genre in anime.genres" :key="genre" class="rounded-full border px-2.75 py-1 text-[11px]"
            style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); color: #c4b5fd">
            {{ genre }}
          </span>
        </div>

        <div v-if="anime.synopsis">
          <div class="mb-2 text-[13px] font-bold text-white">Sinopse</div>
          <p class="text-[12.5px] leading-relaxed text-(--ink-text-muted)">{{ anime.synopsis }}</p>
        </div>

        <div>
          <div class="mb-2.5 text-[13px] font-bold text-white">
            {{ calendarEntry ? 'No seu calendário' : 'Adicionar ao calendário' }}
          </div>
          <!-- Clique no dia adiciona (sem entry ainda) ou troca (já tem entry
               noutro dia) — sem endpoint novo, ver useCalendarSlot. O dia atual
               fica com o accent + check pra ficar óbvio qual está selecionado. -->
          <div class="grid grid-cols-4 gap-2">
            <button v-for="day in WEEKDAY_ORDER" :key="day" type="button" :disabled="savingDay"
              :title="day === calendarEntry?.weekday ? `Já está em ${WEEKDAY_META[day].short}` : `Mover para ${WEEKDAY_META[day].short}`"
              class="glass flex items-center justify-center gap-1 rounded-[9px] py-2.25 text-center text-xs disabled:cursor-wait disabled:opacity-60"
              :class="day === calendarEntry?.weekday ? 'text-white' : 'text-(--ink-text-faint) hover:border-white/25 hover:text-(--ink-text)'"
              :style="day === calendarEntry?.weekday
                ? 'border-color: rgba(139, 92, 246, 0.5); background: rgba(139, 92, 246, 0.18)'
                : ''" @click="setWeekday(day)">
              <Check v-if="day === calendarEntry?.weekday" :size="10" />
              {{ WEEKDAY_META[day].short }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
