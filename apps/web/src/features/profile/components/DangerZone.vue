<script setup lang="ts">
import { ref } from 'vue'
import DeleteAccountModal from './DeleteAccountModal.vue'

const showModal = ref(false)
</script>

<template>
  <div class="rounded-[18px] glass border px-5.5 py-5.5" style="background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.25)">
    <div class="font-display mb-1.5 text-[14.5px] font-bold text-(--ink-error)">Zona de risco</div>
    <p class="mb-3.5 text-[12.5px] leading-[1.6] text-(--ink-text-muted)">
      Deletar sua conta remove permanentemente seu calendário, progresso e estatísticas. Essa ação não pode ser
      desfeita.
    </p>
    <button
      type="button"
      class="flex glass h-10.5 w-full items-center justify-center rounded-[10px] border text-[13.5px] font-semibold text-(--ink-error)"
      style="border-color: rgba(239, 68, 68, 0.4)"
      @click="showModal = true"
    >
      Deletar conta
    </button>

    <DeleteAccountModal v-if="showModal" @close="showModal = false" />
  </div>
</template>
