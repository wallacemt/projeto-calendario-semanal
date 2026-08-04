<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { FollowUserDto } from '../api'

const props = defineProps<{
  title: string
  users: FollowUserDto[]
  loading: boolean
  // Só a lista "Seguindo" mostra botão de deixar de seguir — a de
  // "Seguidores" é só leitura (não dá pra "remover" um seguidor daqui).
  allowUnfollow?: boolean
}>()
const emit = defineEmits<{ close: []; unfollow: [username: string] }>()

const AVATAR_COLORS = [
  'linear-gradient(135deg,#8B5CF6,#4F8EF7)',
  'linear-gradient(135deg,#F59E0B,#F97316)',
  'linear-gradient(135deg,#EC4899,#F472B6)',
  'linear-gradient(135deg,#5EEAD4,#2DD4BF)',
  'linear-gradient(135deg,#4F8EF7,#7DD3FC)',
]
function avatarColor(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-24" @click.self="emit('close')">
    <div class="flex max-h-[70vh] w-full max-w-110 flex-col overflow-hidden rounded-2xl border"
      style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
      <div class="flex items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
        <div class="font-display text-[15px] font-bold text-(--ink-text)">{{ title }}</div>
        <button type="button" class="text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        <p v-if="!loading && users.length === 0" class="py-10 text-center text-[12.5px] text-(--ink-text-faint)">
          Ninguém por aqui ainda.
        </p>

        <RouterLink v-for="user in props.users" :key="user.id" :to="{ name: 'user-profile', params: { username: user.username } }"
          class="flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-white/5" @click="emit('close')">
          <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" class="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
          <div v-else class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
            :style="{ background: avatarColor(user.username) }">
            {{ user.username[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[13.5px] font-semibold text-(--ink-text)">{{ user.username }}</div>
            <div v-if="user.bio" class="truncate text-[11.5px] text-(--ink-text-faint)">{{ user.bio }}</div>
          </div>
          <button v-if="allowUnfollow" type="button"
            class="flex-shrink-0 rounded-[8px] border border-white/10 px-3 py-1.5 text-[11.5px] font-semibold text-(--ink-text-muted) hover:border-red-400/40 hover:text-red-400"
            @click.prevent.stop="emit('unfollow', user.username)">
            Deixar de seguir
          </button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
