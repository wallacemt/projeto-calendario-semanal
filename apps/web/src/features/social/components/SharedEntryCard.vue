<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Heart, MessageCircle } from 'lucide-vue-next'
import type { CalendarEntryResponse } from '../../calendar/api'
import { STATUS_META } from '../../calendar/components/entry-status-meta'
import { HttpError } from '../../../lib/http'
import { useToastStore } from '../../../stores/toast'
import { socialApi } from '../api'
import CommentsModal from './CommentsModal.vue'

const props = defineProps<{
  entry: CalendarEntryResponse
  // false pro visitante sem sessão — card continua mostrando contagens, só
  // não deixa agir (mesmo raciocínio de canPost no CommentsModal).
  canInteract: boolean
  reactedByMe: boolean
}>()

const toast = useToastStore()
const route = useRoute()
const router = useRouter()

// Estado local pra reação/contagens responder na hora (otimista) sem
// esperar o board inteiro recarregar — o pai só passa o valor INICIAL.
const reacted = ref(props.reactedByMe)
const reactionCount = ref(props.entry.social?.reactionCount ?? 0)
const commentCount = ref(props.entry.social?.commentCount ?? 0)
const showComments = ref(false)
const reacting = ref(false)

// GET /social/entries/:id/comments e POST reactions/comments exigem sessão
// (JwtAuthGuard global — nenhuma rota de social é @Public()). Sem esse
// guard no clique, o visitante anônimo do link compartilhado tomaria um 401
// cru da API só por tocar no coração; aqui ele nunca chega a disparar a
// requisição — vai direto pro login, com volta pra essa mesma página.
function requireLogin(): boolean {
  if (props.canInteract) return true
  router.push({ name: 'login', query: { redirect: route.fullPath } })
  return false
}

async function toggleReaction() {
  if (!requireLogin() || reacting.value) return
  reacting.value = true
  try {
    const { reacted: nowReacted } = await socialApi.toggleReaction(props.entry.id)
    reacted.value = nowReacted
    reactionCount.value += nowReacted ? 1 : -1
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao reagir')
  } finally {
    reacting.value = false
  }
}

function openComments() {
  if (!requireLogin()) return
  showComments.value = true
}

// Mesmo cálculo do EntryCard "de verdade" (features/calendar) — só sem os
// emits de progress/remove/contextmenu: quem vê pelo link não edita nada.
const ongoing = computed(() => props.entry.totalEpisodes == null)
const pct = computed(() => {
  if (ongoing.value) return 100
  const total = props.entry.totalEpisodes as number
  if (total <= 0) return 0
  return Math.min(100, Math.round((props.entry.currentEpisode / total) * 100))
})
const epLabel = computed(() =>
  ongoing.value
    ? `Ep. ${props.entry.currentEpisode} · em exibição`
    : `Ep. ${props.entry.currentEpisode}/${props.entry.totalEpisodes}`,
)
const meta = computed(() => STATUS_META[props.entry.status])
</script>

<template>
  <div class="glass flex-shrink-0 overflow-hidden rounded-[13px]">
    <div class="relative aspect-2/3 bg-white/5">
      <img v-if="entry.anime.imageUrl" :src="entry.anime.imageUrl" :alt="entry.anime.title" class="h-full w-full object-cover" />
      <div class="pointer-events-none absolute inset-0"
        style="background: linear-gradient(to bottom, rgba(5, 6, 9, 0.5) 0%, transparent 22%, transparent 78%, rgba(5, 6, 9, 0.8) 100%)" />
    </div>
    <div class="p-2.25 pb-2.75">
      <div class="mb-1.5 line-clamp-2 min-h-7.25 text-[11.5px] leading-tight font-bold text-(--ink-text)">
        {{ entry.anime.title }}
      </div>
      <div class="mb-1.25 text-[10px] text-(--ink-text-muted)">{{ epLabel }}</div>
      <div v-if="!ongoing" class="mb-2 h-1 overflow-hidden rounded-full" style="background: rgba(255, 255, 255, 0.07)">
        <div class="h-full" :style="{ width: `${pct}%`, background: meta.bar }" />
      </div>
      <div class="inline-flex rounded-full px-2 py-0.75 text-[9.5px] font-semibold"
        :style="{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }">
        {{ meta.label }}
      </div>

      <!-- -m-1.5 p-1.5: alvo de toque de ~30px sem alterar o tamanho visual
           do ícone/texto — o card é minúsculo de propósito (grid denso), mas
           o dedo não precisa ser tão preciso quanto o cursor. -->
      <div class="mt-2 flex items-center gap-1 border-t border-white/6 pt-2" :class="!canInteract && 'opacity-50'">
        <button type="button" :title="canInteract ? 'Reagir' : 'Entre para reagir'" :disabled="reacting"
          class="-m-1.5 flex items-center gap-1 p-1.5 text-[10.5px] font-semibold transition-colors disabled:opacity-60"
          :class="reacted ? 'text-red-400' : 'text-(--ink-text-faint) hover:text-red-400'"
          @click="toggleReaction">
          <Heart :size="13" :fill="reacted ? 'currentColor' : 'none'" :class="reacted && 'scale-110'" class="transition-transform" />
          {{ reactionCount }}
        </button>
        <button type="button" :title="canInteract ? 'Comentários' : 'Entre para comentar'"
          class="-m-1.5 flex items-center gap-1 p-1.5 text-[10.5px] font-semibold text-(--ink-text-faint) transition-colors hover:text-(--brand-secondary)"
          @click="openComments">
          <MessageCircle :size="13" />
          {{ commentCount }}
        </button>
      </div>
    </div>

    <CommentsModal v-if="showComments" :entry-id="entry.id" :anime-title="entry.anime.title" :can-post="canInteract"
      @close="showComments = false" @count-change="commentCount += $event" />
  </div>
</template>
