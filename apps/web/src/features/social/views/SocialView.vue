<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, Copy, Link2, UserPlus, Users, X } from 'lucide-vue-next'
import AppShell from '../../../components/AppShell.vue'
import FollowListModal from '../components/FollowListModal.vue'
import { useSocialStore } from '../store'
import type { DiscoverUserDto, NotificationDto } from '../api'

const social = useSocialStore()

onMounted(() => {
  social.fetchShare()
  social.fetchStats()
  social.fetchSuggestions()
  social.fetchNotifications()
})

const followListOpen = ref<'following' | 'followers' | null>(null)
function openFollowList(kind: 'following' | 'followers') {
  followListOpen.value = kind
  if (kind === 'following') social.fetchFollowing()
  else social.fetchFollowers()
}
function onUnfollowFromModal(username: string) {
  social.unfollow(username)
}

const tab = ref<'share' | 'social'>('share')

const shareUrl = computed(() =>
  social.share ? `${window.location.origin}/c/${social.share.token}` : '',
)
const copied = ref(false)
function copyLink() {
  if (!shareUrl.value) return
  navigator.clipboard.writeText(shareUrl.value).catch(() => undefined)
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

const inviteUsername = ref('')
async function submitInvite() {
  const username = inviteUsername.value.trim().replace(/^@/, '')
  if (!username) return
  const ok = await social.invite(username)
  if (ok) inviteUsername.value = ''
}

// Paleta fixa hasheada pelo username — mesma ideia de qualquer avatar sem
// foto (GitHub, Slack): cor estável por pessoa sem precisar guardar nada no
// banco só pra isso.
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

const sinceFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
// Intl.RelativeTimeFormat é nativo do browser (baseline desde 2020) — sem
// dependência nova só pra "há 12min"/"ontem" no feed de notificações.
const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
function timeAgo(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  return rtf.format(Math.round(diffHour / 24), 'day')
}

const NOTIF_ICON: Record<NotificationDto['type'], string> = {
  FOLLOW: '👤',
  COMMENT: '💬',
  REACTION: '❤️',
}

function onNotifClick(notification: NotificationDto) {
  social.markRead(notification.id)
}

function onFollow(user: DiscoverUserDto) {
  social.followSuggestion(user)
}
</script>

<template>
  <AppShell title="Compartilhamento & Social" subtitle="Gerencie acessos ao seu calendário e sua rede">
    <div class="flex items-center justify-end px-6 pt-5 sm:px-8">
      <div class="glass flex items-center gap-1 rounded-[11px] p-1">
        <button type="button"
          class="rounded-[8px] px-4 py-2 text-[12.5px] font-bold transition-colors"
          :style="tab === 'share'
            ? { background: 'linear-gradient(135deg,#8B5CF6,#4F8EF7)', color: '#fff' }
            : { color: '#9CA3B0' }"
          @click="tab = 'share'">
          🔗 Compartilhamento
        </button>
        <button type="button"
          class="rounded-[8px] px-4 py-2 text-[12.5px] font-bold transition-colors"
          :style="tab === 'social'
            ? { background: 'linear-gradient(135deg,#8B5CF6,#4F8EF7)', color: '#fff' }
            : { color: '#9CA3B0' }"
          @click="tab = 'social'">
          🌐 Social & Notificações
        </button>
      </div>
    </div>

    <!-- ABA COMPARTILHAMENTO (M9) -->
    <div v-if="tab === 'share'" class="flex flex-wrap gap-5 p-6 sm:p-8">
      <div class="flex w-full flex-col gap-5 sm:w-100">
        <div class="glass rounded-[18px] p-6.5">
          <div class="mb-1.5 flex items-center justify-between">
            <div class="font-display text-[15.5px] font-bold text-white">Link view-only</div>
            <button type="button" class="h-6 w-10.5 flex-shrink-0 rounded-full p-0.5 transition-colors"
              :style="{ background: social.share?.active ? 'linear-gradient(135deg,#8B5CF6,#4F8EF7)' : 'rgba(255,255,255,0.1)' }"
              @click="social.toggleShare()">
              <div class="h-5 w-5 rounded-full bg-white transition-transform"
                :style="{ transform: social.share?.active ? 'translateX(18px)' : 'translateX(0)' }" />
            </button>
          </div>
          <p class="mb-4 text-[12.5px] leading-relaxed text-(--ink-text-faint)">
            {{ social.share?.active
              ? 'Seu calendário está visível para quem tem o link.'
              : 'Compartilhamento desativado — o link não funciona.' }}
          </p>

          <div class="flex items-center gap-2 rounded-[11px] border border-white/8 bg-white/4 px-3 py-2.5 transition-opacity"
            :style="{ opacity: social.share?.active ? 1 : 0.4 }">
            <Link2 :size="13" class="flex-shrink-0 text-(--ink-text-faint)" />
            <span class="flex-1 truncate font-mono text-[12px] text-(--ink-text-muted)">{{ shareUrl }}</span>
            <button type="button"
              class="flex flex-shrink-0 items-center gap-1 rounded-[8px] px-3 py-1.5 text-[11.5px] font-bold"
              style="background: rgba(139,92,246,0.16); border: 1px solid rgba(139,92,246,0.35); color: #c4b5fd"
              @click="copyLink">
              <component :is="copied ? Check : Copy" :size="12" />
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>

          <div class="mt-4.5 border-t border-white/6 pt-4.5">
            <div class="mb-2.5 text-[12px] text-(--ink-text-faint)">Permissão do link</div>
            <div class="flex items-center gap-2.5 rounded-[11px] px-3.5 py-2.75"
              style="background: rgba(94,234,212,0.06); border: 1px solid rgba(94,234,212,0.25)">
              <span class="text-[14px]">👁️</span>
              <div>
                <div class="text-[13px] font-semibold text-(--ink-text)">Somente visualização</div>
                <div class="text-[11px] text-(--ink-text-faint)">Não pode editar calendário ou notas</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass rounded-[18px] p-5.5">
          <div class="mb-3 font-display text-[14.5px] font-bold text-white">Convidar por usuário</div>
          <form class="flex gap-2" @submit.prevent="submitInvite">
            <input v-model="inviteUsername" type="text" placeholder="@usuário"
              class="h-10 flex-1 rounded-[10px] border border-white/10 bg-white/4 px-3 text-[13px] text-(--ink-text) outline-none placeholder:text-(--ink-text-faint)" />
            <button type="submit" :disabled="social.inviting"
              class="h-10 flex-shrink-0 rounded-[10px] px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
              style="background: linear-gradient(135deg,#8B5CF6,#4F8EF7)">
              Convidar
            </button>
          </form>
        </div>
      </div>

      <div class="glass flex min-w-0 flex-1 flex-col gap-4 rounded-[18px] p-6.5">
        <div class="flex items-center justify-between">
          <div class="font-display text-[15.5px] font-bold text-white">Pessoas com acesso</div>
          <span class="text-[12px] text-(--ink-text-faint)">
            {{ social.share?.grants.length ?? 0 }} pessoa{{ social.share?.grants.length === 1 ? '' : 's' }}
          </span>
        </div>

        <p v-if="social.share && social.share.grants.length === 0" class="py-8 text-center text-[12.5px] text-(--ink-text-faint)">
          Ninguém foi convidado ainda.
        </p>

        <div v-for="grant in social.share?.grants" :key="grant.id"
          class="flex items-center gap-3.5 rounded-[13px] border border-white/6 bg-white/2 px-4 py-3.5">
          <RouterLink :to="{ name: 'user-profile', params: { username: grant.username } }" class="flex min-w-0 flex-1 items-center gap-3.5">
            <img v-if="grant.avatarUrl" :src="grant.avatarUrl" alt="" class="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            <div v-else class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
              :style="{ background: avatarColor(grant.username) }">
              {{ grant.username[0]?.toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[13.5px] font-semibold text-(--ink-text) hover:underline">{{ grant.username }}</div>
              <div class="text-[11.5px] text-(--ink-text-faint)">
                @{{ grant.username }} · desde {{ sinceFormatter.format(new Date(grant.since)) }}
              </div>
            </div>
          </RouterLink>
          <span class="flex-shrink-0 rounded-full px-2.5 py-1 text-[10.5px]"
            style="background: rgba(94,234,212,0.1); border: 1px solid rgba(94,234,212,0.25); color: #5eead4">
            👁️ Visualização
          </span>
          <button type="button" title="Revogar acesso"
            class="flex flex-shrink-0 items-center gap-1 rounded-[9px] px-3 py-1.75 text-[12px] font-semibold text-red-400"
            style="border: 1px solid rgba(239,68,68,0.3)" @click="social.revoke(grant.id)">
            <X :size="12" /> Revogar
          </button>
        </div>
      </div>
    </div>

    <!-- ABA SOCIAL & NOTIFICAÇÕES (M10) -->
    <div v-else class="flex flex-wrap gap-5 p-6 sm:p-8">
      <div class="glass flex min-w-0 flex-[1.1] flex-col gap-4 rounded-[18px] p-6.5">
        <div class="flex items-center justify-between">
          <div class="font-display text-[15.5px] font-bold text-white">Notificações</div>
          <button type="button" class="text-[12px] font-semibold text-(--brand-secondary)" @click="social.markAllRead()">
            Marcar todas como lidas
          </button>
        </div>

        <p v-if="!social.notificationsLoading && social.notifications.length === 0"
          class="py-10 text-center text-[12.5px] text-(--ink-text-faint)">
          Nenhuma notificação ainda.
        </p>

        <div v-for="notif in social.notifications" :key="notif.id"
          class="flex cursor-pointer items-start gap-3.5 rounded-[13px] px-4 py-3.5 transition-colors hover:bg-white/5"
          :style="{
            background: notif.read ? 'transparent' : 'rgba(139,92,246,0.05)',
            border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.16)'}`,
          }"
          @click="onNotifClick(notif)">
          <div class="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-[11px] text-[16px]"
            style="background: rgba(139,92,246,0.14)">
            {{ NOTIF_ICON[notif.type] }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[13px] leading-relaxed text-(--ink-text)">
              <span v-if="notif.actor" class="font-bold text-white">{{ notif.actor.username }}</span>
              {{ notif.message }}
            </div>
            <div class="mt-1 text-[11px] text-(--ink-text-faint)">{{ timeAgo(notif.createdAt) }}</div>
          </div>
          <div v-if="!notif.read" class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style="background: #8b5cf6" />
        </div>
      </div>

      <div class="flex w-full flex-col gap-5 sm:w-96">
        <div class="glass flex items-center justify-around rounded-[18px] p-5.5 text-center">
          <button type="button" class="cursor-pointer" @click="openFollowList('followers')">
            <div class="font-display text-[22px] font-extrabold text-white">{{ social.stats?.followers ?? '—' }}</div>
            <div class="mt-0.5 text-[11px] text-(--ink-text-faint) hover:text-(--ink-text)">Seguidores</div>
          </button>
          <div class="h-8 w-px bg-white/8" />
          <button type="button" class="cursor-pointer" @click="openFollowList('following')">
            <div class="font-display text-[22px] font-extrabold text-white">{{ social.stats?.following ?? '—' }}</div>
            <div class="mt-0.5 text-[11px] text-(--ink-text-faint) hover:text-(--ink-text)">Seguindo</div>
          </button>
        </div>

        <div class="glass flex flex-1 flex-col gap-3.5 rounded-[18px] p-5.5">
          <div class="font-display text-[14.5px] font-bold text-white">Descobrir pessoas</div>

          <p v-if="!social.discoverLoading && social.suggestions.length === 0" class="py-6 text-center text-[12.5px] text-(--ink-text-faint)">
            <Users :size="18" class="mx-auto mb-2 text-(--ink-text-faint)" />
            Sem sugestões por enquanto.
          </p>

          <div v-for="sug in social.suggestions" :key="sug.id" class="flex items-center gap-3">
            <RouterLink :to="{ name: 'user-profile', params: { username: sug.username } }" class="flex min-w-0 flex-1 items-center gap-3">
              <img v-if="sug.avatarUrl" :src="sug.avatarUrl" alt="" class="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
              <div v-else class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                :style="{ background: avatarColor(sug.username) }">
                {{ sug.username[0]?.toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-[13px] font-semibold text-(--ink-text) hover:underline">{{ sug.username }}</div>
                <div class="text-[11px] text-(--ink-text-faint)">
                  {{ sug.mutualCount > 0 ? `${sug.mutualCount} em comum` : 'Novo na comunidade' }}
                </div>
              </div>
            </RouterLink>
            <button type="button"
              class="flex flex-shrink-0 items-center gap-1 rounded-[9px] px-3 py-1.5 text-[11.5px] font-bold"
              style="background: rgba(139,92,246,0.16); border: 1px solid rgba(139,92,246,0.35); color: #c4b5fd"
              @click="onFollow(sug)">
              <UserPlus :size="11" /> Seguir
            </button>
          </div>
        </div>
      </div>
    </div>

    <FollowListModal v-if="followListOpen === 'following'" title="Seguindo" :users="social.following"
      :loading="social.followingLoading" allow-unfollow @close="followListOpen = null" @unfollow="onUnfollowFromModal" />
    <FollowListModal v-if="followListOpen === 'followers'" title="Seguidores" :users="social.followers"
      :loading="social.followersLoading" @close="followListOpen = null" />
  </AppShell>
</template>
