<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LoaderCircle } from 'lucide-vue-next'
import { HttpError } from '../../../lib/http'
import { useToastStore } from '../../../stores/toast'
import { useProfileStore } from '../store'

const emit = defineEmits<{ close: [] }>()

const store = useProfileStore()
const router = useRouter()
const toast = useToastStore()
const deleting = ref(false)

async function confirmDelete() {
  deleting.value = true
  try {
    await store.deleteAccount()
    await router.push({ name: 'login' })
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Não foi possível deletar a conta.')
    deleting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="emit('close')">
      <div
        class="w-full max-w-md rounded-[18px] border p-6"
        style="background: #0d0e17; border-color: rgba(239, 68, 68, 0.25)"
        role="dialog"
        aria-modal="true"
      >
        <div class="font-display mb-2 text-[16px] font-bold text-(--ink-error)">Deletar sua conta?</div>
        <p class="mb-5 text-[13px] leading-[1.6] text-(--ink-text-muted)">
          Isso remove permanentemente seu calendário, progresso e estatísticas. Essa ação não pode ser desfeita.
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            :disabled="deleting"
            class="h-10.5 rounded-[10px] border border-white/10 px-5 text-[13.5px] text-(--ink-text-muted) disabled:opacity-60"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="deleting"
            class="flex h-10.5 items-center gap-2 rounded-[10px] bg-(--ink-error) px-5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            @click="confirmDelete"
          >
            <LoaderCircle v-if="deleting" :size="14" class="animate-spin" />
            Deletar permanentemente
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
