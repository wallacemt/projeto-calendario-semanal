<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { loginSchema } from '@aniweek/shared'
import { useAuthStore } from '../../../stores/auth'
import { HttpError } from '../../../lib/http'
import { env } from '../../../lib/env'
import AuthShell from '../components/AuthShell.vue'
import AuthTextField from '../components/AuthTextField.vue'
import AuthButton from '../components/AuthButton.vue'
import AuthProviderButton from '../components/AuthProviderButton.vue'
import IconGoogle from '../components/icons/IconGoogle.vue'
import IconGithub from '../components/icons/IconGithub.vue'

const API_URL = env.VITE_API_URL

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const showPassword = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
  error.value = null

  // Mesmo schema Zod que o backend usa (packages/shared) — feedback
  // imediato sem round-trip para erro óbvio de formato.
  const parsed = loginSchema.safeParse({ email: email.value, password: password.value })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  loading.value = true
  try {
    await auth.login(parsed.data)
    await router.push({ name: 'home' })
  } catch (err) {
    error.value = err instanceof HttpError ? err.message : 'Não foi possível entrar.'
  } finally {
    loading.value = false
  }
}

function loginWithProvider(provider: 'google' | 'github') {
  // Redirect de página inteira — o backend conduz o fluxo OAuth (ADR-11) e
  // devolve o usuário em /oauth-callback já com o cookie de refresh setado.
  window.location.href = `${API_URL}/auth/oauth/${provider}`
}
</script>

<template>
  <AuthShell heroSubtitle="Monte seu calendário por dia da semana, acompanhe o progresso dos episódios e nunca perca a estreia da temporada.">
    <template #hero-title>Sua semana de<br />animes, organizada.</template>

    <div class="font-mono mb-2.5 text-[11.5px] tracking-[0.12em] text-(--brand-primary)">
      ENTRAR
    </div>
    <h1 class="font-display mb-2 text-[28px] font-extrabold text-(--ink-text)">
      Bem-vindo de volta
    </h1>
    <p class="mb-6 text-[14.5px] text-(--ink-text-muted)">
      Entre para continuar seu calendário da temporada.
    </p>

    <div class="mb-5 flex gap-3">
      <AuthProviderButton label="Google" @click="loginWithProvider('google')">
        <template #icon><IconGoogle /></template>
      </AuthProviderButton>
      <AuthProviderButton label="GitHub" @click="loginWithProvider('github')">
        <template #icon><IconGithub /></template>
      </AuthProviderButton>
    </div>

    <div class="mb-5 flex items-center gap-3">
      <div class="h-px flex-1 bg-white/8" />
      <span class="font-sans text-[11px] tracking-[0.06em] text-(--ink-text-faint) uppercase">
        ou com e-mail
      </span>
      <div class="h-px flex-1 bg-white/8" />
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <AuthTextField
        id="email"
        v-model="email"
        label="E-mail"
        type="email"
        autocomplete="email"
        placeholder="voce@email.com"
        required
      />

      <AuthTextField
        id="password"
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        label="Senha"
        autocomplete="current-password"
        placeholder="••••••••"
        required
      >
        <template #label-action>
          <RouterLink
            :to="{ name: 'forgot-password' }"
            class="text-[12.5px] text-(--brand-primary) hover:text-(--brand-secondary)"
          >
            Esqueci minha senha
          </RouterLink>
        </template>
        <template #trailing>
          <button
            type="button"
            aria-label="Mostrar ou ocultar senha"
            class="text-(--ink-text-faint) hover:text-(--ink-text)"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </template>
      </AuthTextField>

      <p v-if="error" class="text-sm text-(--ink-error)">{{ error }}</p>

      <AuthButton type="submit" :loading="loading" class="mt-1">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </AuthButton>
    </form>

    <p class="mt-6 text-center text-[13.5px] text-(--ink-text-muted)">
      Não tem uma conta?
      <RouterLink :to="{ name: 'register' }" class="text-(--brand-primary) hover:text-(--brand-secondary)">
        Criar conta
      </RouterLink>
    </p>
  </AuthShell>
</template>
