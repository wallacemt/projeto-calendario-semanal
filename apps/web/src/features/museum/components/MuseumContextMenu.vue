<script setup lang="ts">
import { Pencil, Star, StarOff, Trash2 } from 'lucide-vue-next'

// Mesmo padrão do EntryContextMenu (calendário) — right-click no card, menu
// flutuante posicionado no clique, overlay full-screen só pra fechar fora.
defineProps<{ x: number; y: number; featured: boolean }>()
const emit = defineEmits<{ edit: []; remove: []; toggleFeatured: []; close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50" @click="emit('close')" @contextmenu.prevent="emit('close')">
    <div class="absolute flex w-52 flex-col overflow-hidden rounded-xl border py-1 shadow-2xl"
      :style="{ top: `${y}px`, left: `${x}px`, background: '#0a0b12', borderColor: 'rgba(255, 255, 255, 0.1)' }"
      @click.stop>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-(--ink-text) hover:bg-white/5"
        @click="emit('toggleFeatured')">
        <StarOff v-if="featured" :size="14" />
        <Star v-else :size="14" />
        {{ featured ? 'Desfixar destaque' : 'Fixar em destaque' }}
      </button>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-(--ink-text) hover:bg-white/5"
        @click="emit('edit')">
        <Pencil :size="14" /> Editar
      </button>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-400 hover:bg-red-500/10"
        @click="emit('remove')">
        <Trash2 :size="14" /> Remover
      </button>
    </div>
  </div>
</template>
