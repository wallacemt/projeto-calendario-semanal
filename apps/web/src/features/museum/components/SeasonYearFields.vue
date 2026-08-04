<script setup lang="ts">
import { computed } from 'vue'
import { Season } from '@aniweek/shared'
import AwSelect from '../../../components/AwSelect.vue'
import { seasonMeta } from '../../../lib/season-meta'

// Compartilhado entre AddToCollectionModal (add) e EditWatchedModal (edit) —
// "quando" narrativo do museu (M8.1), independente de completedAt (ver
// comentário no model WatchedAnime). Ambos opcionais: sem estação/ano, a UI
// cai pra exibir a data exata do registro.
const props = defineProps<{ season: Season | null; year: number | null }>()
const emit = defineEmits<{ 'update:season': [Season | null]; 'update:year': [number | null] }>()

const NONE = ''
const seasonOptions = [
  { value: NONE, label: 'Não especificar' },
  ...Object.values(Season).map((s) => ({ value: s as string, label: `${seasonMeta[s].emoji} ${seasonMeta[s].label}` })),
]

const seasonModel = computed<string>({
  get: () => props.season ?? NONE,
  set: (v) => emit('update:season', v === NONE ? null : (v as Season)),
})

function onYearInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:year', value.trim() ? Number(value) : null)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="mb-1.5 block text-[12px] text-(--ink-text-muted)">Estação assistida</label>
      <AwSelect v-model="seasonModel" :options="seasonOptions" />
    </div>
    <div>
      <label class="mb-1.5 block text-[12px] text-(--ink-text-muted)">Ano assistido</label>
      <input type="number" :value="year ?? ''" placeholder="2024" min="1900" max="2100" @input="onYearInput"
        class="h-10.5 w-full rounded-[10px] border px-3.5 text-[13px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)"
        style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)" />
    </div>
  </div>
</template>
