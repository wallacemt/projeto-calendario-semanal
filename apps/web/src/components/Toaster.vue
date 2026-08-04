<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[100] flex w-full max-w-90 flex-col gap-2.5">
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-[13px] shadow-lg"
          :style="t.type === 'error'
            ? 'background: #1a0f14; border-color: rgba(239,68,68,0.35); color: #f87171'
            : 'background: #0f1a14; border-color: rgba(34,197,94,0.35); color: #4ade80'"
        >
          <span class="flex-1 leading-relaxed">{{ t.message }}</span>
          <button type="button" class="text-(--ink-text-faint) hover:text-(--ink-text)" @click="toast.dismiss(t.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
