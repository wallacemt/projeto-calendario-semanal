<script setup lang="ts">
import { ref } from 'vue'
import { updateProfileSchema } from '@aniweek/shared'
import { Pencil } from 'lucide-vue-next'
import { HttpError } from '../../../lib/http'
import { useToastStore } from '../../../stores/toast'
import type { Profile } from '../api'
import { useProfileStore } from '../store'

const props = defineProps<{ profile: Profile }>()

const store = useProfileStore()
const toast = useToastStore()
const editing = ref(false)
const username = ref(props.profile.username)
const bio = ref(props.profile.bio ?? '')
// Só erro de validação (Zod) — fica perto do campo porque é acionável ali
// mesmo. Falha de API (rede, 409, etc.) vai pro toast (não tem campo pra
// apontar).
const error = ref<string | null>(null)
const saving = ref(false)
const savingPrivacy = ref(false)

// Independente do form de username/bio — é um toggle isolado, não faz
// sentido exigir "Editar" -> "Salvar" só pra isso (LGPD: o titular deve
// conseguir mudar isso a qualquer momento, sem fricção).
async function toggleStatsPublic() {
  savingPrivacy.value = true
  try {
    await store.update({ statsPublic: !props.profile.statsPublic })
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Não foi possível salvar.')
  } finally {
    savingPrivacy.value = false
  }
}

function startEdit() {
  username.value = props.profile.username
  bio.value = props.profile.bio ?? ''
  error.value = null
  editing.value = true
}

async function save() {
  const parsed = updateProfileSchema.safeParse({
    // Só manda o que mudou — evita 409 de "username já em uso" batendo no
    // próprio username do usuário quando ele só editou a bio.
    username: username.value !== props.profile.username ? username.value : undefined,
    bio: bio.value !== (props.profile.bio ?? '') ? bio.value : undefined,
  })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  saving.value = true
  error.value = null
  try {
    await store.update(parsed.data)
    editing.value = false
  } catch (err) {
    toast.push(err instanceof HttpError ? err.message : 'Não foi possível salvar.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="rounded-[18px] glass border border-white/8 bg-white/3.5 px-7 py-6.5">
    <div class="mb-4.5 flex items-center justify-between">
      <div class="font-display text-[15.5px] font-bold text-white">Informações</div>
      <button
        v-if="!editing"
        type="button"
        class="flex items-center glass gap-1.5 rounded-[9px] border border-white/12 px-3.5 py-1.75 text-[12.5px] text-(--ink-text-muted) hover:bg-white/5 hover:text-white"
        @click="startEdit"
      >
        <Pencil :size="13" /> Editar
      </button>
    </div>

    <div v-if="!editing">
      <div class="mb-4.5 grid grid-cols-2 gap-5">
        <div>
          <div class="mb-1 text-[11.5px] text-(--ink-text-faint)">Nome de usuário</div>
          <div class="text-[14.5px] font-semibold text-(--ink-text)">{{ profile.username }}</div>
        </div>
        <div>
          <div class="mb-1 text-[11.5px] text-(--ink-text-faint)">E-mail</div>
          <div class="text-[14.5px] font-semibold text-(--ink-text)">{{ profile.email }}</div>
        </div>
      </div>
      <div class="mb-1 text-[11.5px] text-(--ink-text-faint)">Bio</div>
      <div class="text-[13.5px] leading-[1.6] text-(--ink-text-muted)">
        {{ profile.bio || 'Nenhuma bio ainda.' }}
      </div>
    </div>

    <div v-else>
      <div class="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label for="profile-username" class="mb-1.5 block text-xs text-(--ink-text-muted)">Nome de usuário</label>
          <input
            id="profile-username"
            v-model="username"
            type="text"
            class="h-11 w-full rounded-[11px] border border-white/10 bg-white/4 px-3.5 text-[13.5px] text-(--ink-text) focus:border-transparent focus:ring-2 focus:ring-(--brand-primary) focus:outline-none"
          />
        </div>
        <div>
          <label for="profile-email" class="mb-1.5 block text-xs text-(--ink-text-muted)">E-mail</label>
          <input
            id="profile-email"
            :value="profile.email"
            type="email"
            disabled
            class="h-11 w-full rounded-[11px] border border-white/7 bg-white/2 px-3.5 text-[13.5px] text-(--ink-text-faint)"
          />
        </div>
      </div>
      <label for="profile-bio" class="mb-1.5 block text-xs text-(--ink-text-muted)">Bio</label>
      <textarea
        id="profile-bio"
        v-model="bio"
        rows="3"
        class="mb-4.5 w-full resize-none rounded-[11px] border border-white/10 bg-white/4 px-3.5 py-3 text-[13.5px] text-(--ink-text) focus:border-transparent focus:ring-2 focus:ring-(--brand-primary) focus:outline-none"
      />
      <p v-if="error" class="mb-3 text-[13px] text-(--ink-error)">{{ error }}</p>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          :disabled="saving"
          class="h-10.5 rounded-[10px] border border-white/10 px-5 text-[13.5px] text-(--ink-text-muted) disabled:opacity-60"
          @click="editing = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="h-10.5 rounded-[10px] px-5.5 text-[13.5px] font-bold text-white shadow-[0_10px_24px_rgba(124,92,246,0.3)] disabled:opacity-60"
          style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)"
          @click="save"
        >
          {{ saving ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </div>
    </div>

    <div class="mt-5 flex items-center justify-between border-t border-white/6 pt-4.5">
      <div class="pr-4">
        <div class="text-[13px] font-semibold text-(--ink-text)">Estatísticas públicas</div>
        <div class="text-[11.5px] text-(--ink-text-faint)">
          Exibir suas métricas (RF-10) pra quem visitar seu perfil público. Você sempre vê as suas.
        </div>
      </div>
      <button type="button" :disabled="savingPrivacy"
        class="h-6 w-10.5 flex-shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-60"
        :style="{ background: profile.statsPublic ? 'linear-gradient(135deg,#8B5CF6,#4F8EF7)' : 'rgba(255,255,255,0.1)' }"
        @click="toggleStatsPublic">
        <div class="h-5 w-5 rounded-full bg-white transition-transform"
          :style="{ transform: profile.statsPublic ? 'translateX(18px)' : 'translateX(0)' }" />
      </button>
    </div>
  </div>
</template>
