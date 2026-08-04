<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Lock, UserMinus, UserPlus } from 'lucide-vue-next'
import AppShell from '../../../components/AppShell.vue'
import { HttpError } from '../../../lib/http'
import { useAuthStore } from '../../../stores/auth'
import { useToastStore } from '../../../stores/toast'
import { socialApi, type PublicProfileDto } from '../api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const profile = ref<PublicProfileDto | null>(null)
const loading = ref(true)
const notFound = ref(false)
const followBusy = ref(false)

const username = computed(() => route.params.username as string)
const isSelf = computed(() => auth.user?.username === username.value)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    profile.value = await socialApi.profile(username.value)
  } catch (err) {
    notFound.value = true
    if (!(err instanceof HttpError)) throw err
  } finally {
    loading.value = false
  }
}
// Navegar de um perfil pra outro (ex.: clicando num seguidor de dentro do
// próprio perfil) reusa o componente — watch em vez de só onMounted, senão
// a tela ficava com os dados do usuário anterior até um reload manual.
watch(username, load, { immediate: true })

async function toggleFollow() {
  if (!profile.value) return
  followBusy.value = true
  try {
    if (profile.value.isFollowedByMe) {
      await socialApi.unfollow(profile.value.username)
      profile.value = {
        ...profile.value,
        isFollowedByMe: false,
        followers: profile.value.followers - 1,
      }
    } else {
      await socialApi.follow(profile.value.username)
      profile.value = {
        ...profile.value,
        isFollowedByMe: true,
        followers: profile.value.followers + 1,
      }
    }
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao seguir usuário')
  } finally {
    followBusy.value = false
  }
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
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
  <AppShell title="Perfil" :subtitle="`@${username}`">
    <div class="p-6 sm:p-8">
      <p v-if="loading" class="py-16 text-center text-[13px] text-(--ink-text-faint)">Carregando...</p>

      <div v-else-if="notFound" class="flex flex-col items-center gap-3 py-16 text-center">
        <p class="text-[13px] text-(--ink-text-faint)">Esse usuário não existe.</p>
        <button type="button" class="text-[12.5px] font-semibold text-(--brand-secondary)" @click="router.push({ name: 'social' })">
          Voltar
        </button>
      </div>

      <div v-else-if="profile" class="flex flex-col gap-5">
        <div class="glass flex flex-wrap items-center gap-6 rounded-[18px] p-7">
          <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="" class="h-20 w-20 flex-shrink-0 rounded-full object-cover" />
          <div v-else class="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-[26px] font-bold text-white"
            :style="{ background: avatarColor(profile.username) }">
            {{ profile.username[0]?.toUpperCase() }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="font-display text-[19px] font-extrabold text-white">{{ profile.username }}</div>
            <p v-if="profile.bio" class="mt-1 text-[13px] text-(--ink-text-muted)">{{ profile.bio }}</p>
            <p class="mt-1 text-[11.5px] text-(--ink-text-faint)">Na comunidade desde {{ dateFormatter.format(new Date(profile.createdAt)) }}</p>
            <div class="mt-3 flex items-center gap-5 text-[13px]">
              <span><b class="text-white">{{ profile.followers }}</b> <span class="text-(--ink-text-faint)">seguidores</span></span>
              <span><b class="text-white">{{ profile.following }}</b> <span class="text-(--ink-text-faint)">seguindo</span></span>
              <span v-if="profile.isFollowingMe" class="text-[11.5px] text-(--ink-text-faint)">· Segue você</span>
            </div>
          </div>

          <RouterLink v-if="isSelf" :to="{ name: 'profile' }"
            class="flex-shrink-0 rounded-[10px] border border-white/12 px-4 py-2.5 text-[12.5px] font-semibold text-(--ink-text-muted) hover:text-white">
            Editar perfil
          </RouterLink>
          <button v-else type="button" :disabled="followBusy"
            class="flex flex-shrink-0 items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[12.5px] font-bold disabled:opacity-60"
            :style="profile.isFollowedByMe
              ? { border: '1px solid rgba(255,255,255,0.12)', color: '#9CA3B0' }
              : { background: 'linear-gradient(135deg,#8B5CF6,#4F8EF7)', color: '#fff' }"
            @click="toggleFollow">
            <component :is="profile.isFollowedByMe ? UserMinus : UserPlus" :size="13" />
            {{ profile.isFollowedByMe ? 'Deixar de seguir' : 'Seguir' }}
          </button>
        </div>

        <div v-if="profile.stats" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="glass rounded-[14px] px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Concluídos</div>
            <div class="font-display text-[24px] font-extrabold text-white">{{ profile.stats.totalWatched }}</div>
          </div>
          <div class="glass rounded-[14px] px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Nota média</div>
            <div class="font-display text-[24px] font-extrabold" style="color: #fbbf24">{{ profile.stats.avgRating ?? '—' }}</div>
          </div>
          <div class="glass rounded-[14px] px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Horas assistidas</div>
            <div class="font-display text-[24px] font-extrabold text-white">{{ profile.stats.totalHours }}</div>
          </div>
          <div class="glass rounded-[14px] px-5 py-4.5">
            <div class="mb-2 text-[11.5px] text-(--ink-text-faint)">Eps/semana</div>
            <div class="font-display text-[24px] font-extrabold text-white">{{ profile.stats.episodesPerWeek }}</div>
          </div>
        </div>
        <div v-else class="glass flex items-center gap-3 rounded-[14px] px-5 py-4.5 text-[12.5px] text-(--ink-text-faint)">
          <Lock :size="14" />
          {{ isSelf ? 'Suas estatísticas estão ocultas do público (ver Perfil > Estatísticas públicas).' : 'Este usuário optou por não exibir as estatísticas.' }}
        </div>
      </div>
    </div>
  </AppShell>
</template>
