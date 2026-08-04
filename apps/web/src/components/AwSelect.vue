<script setup lang="ts" generic="T extends string">
import { ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

// Substitui <select> nativo (fora do blueprint — resposta ao bug reportado
// de dropdown ilegível). `color-scheme: dark` (styles/theme.css) ajuda em
// alguns browsers/SOs, mas não é garantia: no Windows, Chromium delega o
// popup de opções pro combo-box nativo do SO, que ignora boa parte do CSS —
// por isso "abre escuro e volta pro padrão". Clássico de entrevista de
// frontend: "por que não dá pra estilizar 100% um <select>?" — resposta é
// essa mesma, e a saída de mercado é trocar por um listbox next próprio
// (o que este componente é), não brigar com o controle nativo.
defineProps<{ modelValue: T; options: { value: T; label: string }[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const open = ref(false)

function pick(value: T) {
  emit('update:modelValue', value)
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-[10px] border px-3 py-2.25 text-left text-[13px] text-(--ink-text)"
      style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)"
      @click="open = !open"
    >
      <span>{{ options.find((o) => o.value === modelValue)?.label }}</span>
      <ChevronDown
        :size="14"
        class="text-(--ink-text-faint)"
        :style="{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }"
      />
    </button>

    <!-- overlay full-screen só pra fechar no clique fora, mesmo padrão do EntryContextMenu -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />

    <div
      v-if="open"
      class="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-[10px] border py-1 shadow-2xl"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-white/5"
        :style="{ color: opt.value === modelValue ? '#C4B5FD' : 'var(--ink-text)' }"
        @click="pick(opt.value)"
      >
        <span>{{ opt.label }}</span>
        <Check v-if="opt.value === modelValue" :size="13" />
      </button>
    </div>
  </div>
</template>
