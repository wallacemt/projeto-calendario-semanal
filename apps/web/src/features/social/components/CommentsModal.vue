<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Send, Trash2, X } from 'lucide-vue-next'
import { HttpError } from '../../../lib/http'
import { useAuthStore } from '../../../stores/auth'
import { useToastStore } from '../../../stores/toast'
import { socialApi, type CommentDto } from '../api'

const props = defineProps<{
  entryId: string
  animeTitle: string
  // false pro visitante sem sessão do link público — vê os comentários mas
  // só descobre o formulário depois de entrar (mesma regra de "reagir" no
  // SharedEntryCard: ler é público, agir exige conta).
  canPost: boolean
}>()
const emit = defineEmits<{ close: []; 'count-change': [delta: number] }>()

const auth = useAuthStore()
const toast = useToastStore()

const comments = ref<CommentDto[]>([])
const loading = ref(true)
const body = ref('')
const posting = ref(false)

onMounted(async () => {
  try {
    comments.value = await socialApi.entryComments(props.entryId)
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao carregar comentários')
  } finally {
    loading.value = false
  }
})

async function submit() {
  const text = body.value.trim()
  if (!text || posting.value) return
  posting.value = true
  try {
    const comment = await socialApi.addComment(props.entryId, text)
    comments.value.push(comment)
    emit('count-change', 1)
    body.value = ''
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao comentar')
  } finally {
    posting.value = false
  }
}

async function remove(comment: CommentDto) {
  try {
    await socialApi.removeComment(comment.id)
    comments.value = comments.value.filter((c) => c.id !== comment.id)
    emit('count-change', -1)
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Erro ao remover comentário')
  }
}

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
function timeAgo(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  return rtf.format(Math.round(diffHour / 24), 'day')
}

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
  <!-- Teleport: sem isso o modal nasce DENTRO do card que o abriu, e o card
       usa .glass (backdrop-filter) — backdrop-filter cria um novo containing
       block pra position:fixed, então o "fixed inset-0" passava a ser
       relativo ao cardzinho de ~150px, não à viewport (era isso que fazia o
       modal parecer preso/espremido dentro do anime). Teleport bota o modal
       como filho direto do <body>, fora dessa cadeia. Mesmo motivo de existir
       Portal no React — todo modal que pode nascer dentro de um ancestral
       com transform/filter precisa disso, clássico de entrevista de CSS. -->
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6" @click.self="emit('close')">
      <div class="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl border sm:max-h-[70vh] sm:max-w-110 sm:rounded-2xl"
        style="background: #0a0b12; border-color: rgba(255, 255, 255, 0.1)">
        <!-- Alça de bottom-sheet — só no mobile, indica "arrastável"/fechável
             mesmo sem gesto real implementado (custaria uma lib só pra isso;
             o tap no X ou no backdrop já fecha). -->
        <div class="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div class="h-1 w-9 rounded-full bg-white/15" />
        </div>
        <div class="flex items-center justify-between border-b p-4" style="border-color: rgba(255, 255, 255, 0.06)">
          <div class="min-w-0">
            <div class="font-display text-[15.5px] font-bold text-(--ink-text)">Comentários</div>
            <div class="truncate text-[12px] text-(--ink-text-faint)">{{ animeTitle }}</div>
          </div>
          <button type="button" class="flex h-8 w-8 flex-shrink-0 items-center justify-center text-(--ink-text-muted) hover:text-(--ink-text)" @click="emit('close')">
            <X :size="19" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-3">
        <p v-if="loading" class="py-10 text-center text-[12.5px] text-(--ink-text-faint)">Carregando...</p>
        <p v-else-if="comments.length === 0" class="py-10 text-center text-[12.5px] text-(--ink-text-faint)">
          Ainda sem comentários. Seja o primeiro!
        </p>

        <div v-for="comment in comments" :key="comment.id" class="group flex items-start gap-3 rounded-[12px] px-3 py-2.5 hover:bg-white/5">
          <img v-if="comment.author.avatarUrl" :src="comment.author.avatarUrl" alt=""
            class="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
          <div v-else class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            :style="{ background: avatarColor(comment.author.username) }">
            {{ comment.author.username[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <RouterLink :to="{ name: 'user-profile', params: { username: comment.author.username } }"
                class="text-[12.5px] font-semibold text-(--ink-text) hover:underline" @click="emit('close')">
                {{ comment.author.username }}
              </RouterLink>
              <span class="text-[10.5px] text-(--ink-text-faint)">{{ timeAgo(comment.createdAt) }}</span>
            </div>
            <p class="text-[13px] leading-relaxed break-words text-(--ink-text-muted)">{{ comment.body }}</p>
          </div>
          <button v-if="comment.author.id === auth.user?.id" type="button" title="Remover comentário"
            class="flex-shrink-0 text-(--ink-text-faint) opacity-0 hover:!text-red-400 group-hover:opacity-100"
            @click="remove(comment)">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>

        <div class="border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style="border-color: rgba(255, 255, 255, 0.06)">
          <!-- h-11 (44px, alvo de toque mínimo recomendado) no mobile; h-10
               some no sm+ porque mouse não precisa da mesma folga do dedo. -->
          <form v-if="canPost" class="flex items-center gap-2" @submit.prevent="submit">
            <input v-model="body" type="text" maxlength="500" placeholder="Escreva um comentário..."
              class="h-11 flex-1 rounded-[10px] border border-white/10 bg-white/4 px-3.5 text-[14px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint) sm:h-10 sm:text-[13px]" />
            <button type="submit" :disabled="!body.trim() || posting"
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] text-white disabled:opacity-40 sm:h-10 sm:w-10"
              style="background: linear-gradient(135deg,#8B5CF6,#4F8EF7)">
              <Send :size="16" />
            </button>
          </form>
          <RouterLink v-else :to="{ name: 'login' }"
            class="block rounded-[10px] py-3 text-center text-[13px] font-semibold text-(--ink-text-muted) hover:text-white sm:py-2.5 sm:text-[12.5px]"
            style="border: 1px solid rgba(255,255,255,0.1)">
            Entre para comentar
          </RouterLink>
        </div>
      </div>
    </div>
  </Teleport>
</template>
