<script setup lang="ts">
import { Eye, Pencil, Trash2, Trophy } from 'lucide-vue-next'

defineProps<{ x: number; y: number }>()
const emit = defineEmits<{ edit: []; remove: []; close: []; view_details: []; complete: [] }>()
</script>

<template>
  <!-- Overlay full-screen só pra fechar no clique fora (mesmo padrão do
       AddEntryModal) — sem depender de @vueuse/core pra um click-outside. -->
  <div class="fixed inset-0 z-50" @click="emit('close')" @contextmenu.prevent="emit('close')">
    <div class="absolute flex w-44 flex-col overflow-hidden rounded-xl border py-1 shadow-2xl"
      :style="{ top: `${y}px`, left: `${x}px`, background: '#0a0b12', borderColor: 'rgba(255, 255, 255, 0.1)' }"
      @click.stop>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-(--color-primary) hover:bg-(--color-primary-hover)/15"
        @click="emit('view_details')">
        <Eye :size="14" /> Ver detalhes
      </button>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-(--ink-text) hover:bg-white/5"
        @click="emit('edit')">
        <Pencil :size="14" /> Editar
      </button>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-(--ink-text) hover:bg-white/5"
        @click="emit('complete')">
        <Trophy :size="14" /> Marcar como assistido
      </button>
      <button type="button"
        class="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-400 hover:bg-red-500/10"
        @click="emit('remove')">
        <Trash2 :size="14" /> Remover
      </button>

    </div>
  </div>
</template>
