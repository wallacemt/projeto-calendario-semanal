<script setup lang="ts">
import { computed, ref } from 'vue'
import { Camera, LoaderCircle } from 'lucide-vue-next'
import type { Profile } from '../api'
import { useProfileStore } from '../store'

const props = defineProps<{ profile: Profile }>()

const store = useProfileStore()
const fileInput = ref<HTMLInputElement>()
const previewUrl = ref<string | null>(null)
const uploading = ref(false)

const displayAvatar = computed(() => previewUrl.value ?? props.profile.avatarUrl)
const initial = computed(() => props.profile.username[0]?.toUpperCase() ?? '?')

const memberSince = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(
  new Date(props.profile.createdAt),
)

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Preview antes do upload (AC #13) — object URL local, trocado pela URL
  // real assim que o backend reprocessa e devolve o avatarUrl definitivo.
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true
  try {
    await store.uploadAvatar(file)
  } finally {
    uploading.value = false
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}
</script>

<template>
  <div class="flex flex-col glass items-center rounded-[18px] border border-white/8 bg-white/3.5 px-6 py-7 text-center">
    <div class="relative mb-4">
      <img
        v-if="displayAvatar"
        :src="displayAvatar"
        alt=""
        class="h-26 w-26 rounded-full object-cover shadow-[0_12px_30px_rgba(124,92,246,0.35)]"
      />
      <div
        v-else
        class="font-display flex h-26 w-26 items-center justify-center rounded-full text-4xl font-extrabold text-white shadow-[0_12px_30px_rgba(124,92,246,0.35)]"
        style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)"
      >
        {{ initial }}
      </div>
      <button
        type="button"
        title="Trocar avatar"
        :disabled="uploading"
        class="absolute -right-0.5 -bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 disabled:opacity-60"
        style="background: #1a1c26; border-color: var(--ink-bg)"
        @click="fileInput?.click()"
      >
        <LoaderCircle v-if="uploading" :size="14" class="animate-spin text-white" />
        <Camera v-else :size="14" class="text-white" />
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </div>

    <div class="font-display text-[19px] font-extrabold text-white">{{ profile.username }}</div>
    <div class="mb-3 text-[13px] text-(--ink-text-faint)">@{{ profile.username }}</div>
    <p v-if="profile.bio" class="mb-4 text-[13px] leading-[1.55] text-(--ink-text-muted)">{{ profile.bio }}</p>

    <div
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px]"
      style="background: rgba(94, 234, 212, 0.1); border: 1px solid rgba(94, 234, 212, 0.25); color: #5eead4"
    >
      Membro desde {{ memberSince }}
    </div>
  </div>
</template>
