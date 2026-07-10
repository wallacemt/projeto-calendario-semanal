<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginSchema } from '@aniweek/shared'
import { useAuthStore } from '../../../stores/auth'
import { HttpError } from '../../../lib/http'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

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
  <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
    <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">Entrar</h1>

    <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <input
        v-model="email"
        type="email"
        required
        placeholder="Email"
        class="rounded border px-3 py-2 outline-none"
        :style="{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
      />
      <input
        v-model="password"
        type="password"
        required
        placeholder="Senha"
        class="rounded border px-3 py-2 outline-none"
        :style="{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
      />

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="rounded px-3 py-2 font-medium disabled:opacity-60"
        :style="{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }"
      >
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <RouterLink :to="{ name: 'forgot-password' }" class="text-center text-sm underline">
        Esqueci minha senha
      </RouterLink>
    </form>

    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="rounded border px-3 py-2 text-sm"
        @click="loginWithProvider('google')"
      >
        Entrar com Google
      </button>
      <button
        type="button"
        class="rounded border px-3 py-2 text-sm"
        @click="loginWithProvider('github')"
      >
        Entrar com GitHub
      </button>
    </div>

    <RouterLink :to="{ name: 'register' }" class="text-center text-sm underline">
      Criar uma conta
    </RouterLink>
  </div>
</template>
