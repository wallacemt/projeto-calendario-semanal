<script setup lang="ts">
import { ref } from 'vue'
import { Season } from '@aniweek/shared'
import { X } from 'lucide-vue-next'
import AwSelect from '../../../components/AwSelect.vue'
import { HttpError } from '../../../lib/http'
import { seasonMeta } from '../../../lib/season-meta'
import { useToastStore } from '../../../stores/toast'
import { calendarApi } from '../api'

const emit = defineEmits<{ close: [] }>()
const toast = useToastStore()

const seasonOptions = Object.values(Season).map((s) => ({ value: s, label: `${seasonMeta[s].emoji} ${seasonMeta[s].label}` }))
const season = ref<Season>(Season.WINTER)
const year = ref(new Date().getFullYear())
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await calendarApi.create({ season: season.value, year: year.value })
    toast.push(`${seasonMeta[season.value].label} ${year.value} criada`)
    emit('close')
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao criar temporada')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" @click.self="emit('close')">
    <div class="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
      <div class="flex items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="font-display text-[15px] font-bold text-(--ink-text)">Nova temporada</div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form class="space-y-4 p-4" @submit.prevent="save">
        <label class="block">
          <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Estação</span>
          <AwSelect v-model="season" :options="seasonOptions" />
        </label>
        <label class="block">
          <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Ano</span>
          <input v-model.number="year" type="number" min="2000" max="2100" class="aw-input" />
        </label>

        <div class="flex justify-end gap-2.5 pt-2">
          <button type="button"
            class="rounded-lg px-4 py-2 text-[13px] font-semibold text-(--ink-text-muted) hover:text-(--ink-text)"
            @click="emit('close')">
            Cancelar
          </button>
          <button type="submit" :disabled="saving"
            class="rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)">
            {{ saving ? 'Criando...' : 'Criar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.aw-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.55rem 0.75rem;
  font-size: 13px;
  color: var(--ink-text);
  outline: none;
}
.aw-input::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0);
  transition: box-shadow 0.2s ease-in-out;
}

.aw-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
}
</style>
