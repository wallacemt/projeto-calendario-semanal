<script setup lang="ts">
import { ref } from 'vue'
import type { Weekday } from '@aniweek/shared'
import { X } from 'lucide-vue-next'
import RatingStars from '../../../components/RatingStars.vue'
import { HttpError } from '../../../lib/http'
import { useToastStore } from '../../../stores/toast'
import type { CalendarEntryResponse } from '../api'
import { useCalendarStore } from '../store'

const props = defineProps<{ entry: CalendarEntryResponse; weekday: Weekday }>()
const emit = defineEmits<{ close: [] }>()

const calendar = useCalendarStore()
const toast = useToastStore()

const rating = ref(8)
const comment = ref('')
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await calendar.completeEntry(props.weekday, props.entry.id, {
      rating: rating.value,
      comment: comment.value.trim() || undefined,
    })
    toast.push('Marcado como assistido — adicionado ao museu', 'success')
    emit('close')
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao marcar como assistido')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" @click.self="emit('close')">
    <div class="w-full max-w-105 rounded-2xl border p-6" style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
      <div class="mb-1 flex items-start justify-between">
        <div class="font-display text-[16px] font-bold text-(--ink-text)">Marcar como assistido</div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <p class="mb-5 text-[12.5px] text-(--ink-text-faint)">{{ entry.anime.title }} entra pro seu museu pessoal.</p>

      <label class="mb-2 block text-[12px] text-(--ink-text-muted)">Sua nota</label>
      <RatingStars v-model="rating" />

      <label class="mt-4 mb-1.5 block text-[12px] text-(--ink-text-muted)">Nota pessoal (opcional)</label>
      <textarea v-model="comment" placeholder="O que essa obra significou pra você?"
        class="h-20 w-full resize-none rounded-[10px] border px-3.5 py-2.5 text-[13px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)"
        style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)" />

      <div class="mt-5 flex justify-end gap-3">
        <button type="button" class="h-10.5 rounded-[10px] border px-4.5 text-[13px] text-(--ink-text-muted)"
          style="border-color: rgba(255, 255, 255, 0.1)" @click="emit('close')">Cancelar</button>
        <button type="button" :disabled="saving"
          class="h-10.5 rounded-[10px] px-5 text-[13px] font-bold text-white disabled:opacity-50"
          style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)" @click="save">
          Adicionar ao museu
        </button>
      </div>
    </div>
  </div>
</template>
