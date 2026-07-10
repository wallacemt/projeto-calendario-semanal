<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerSchema } from '@aniweek/shared'
import { useAuthStore } from '../../../stores/auth'
import { HttpError } from '../../../lib/http'

const email = ref('')
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
  error.value = null

  const parsed = registerSchema.safeParse({
    email: email.value,
    username: username.value,
    password: password.value,
  })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  loading.value = true
  try {
    await auth.register(parsed.data)
    await router.push({ name: 'home' })
  } catch (err) {
    error.value = err instanceof HttpError ? err.message : 'Não foi possível criar a conta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
    <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">Criar conta</h1>

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
        v-model="username"
        type="text"
        required
        placeholder="Usuário"
        class="rounded border px-3 py-2 outline-none"
        :style="{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
      />
      <input
        v-model="password"
        type="password"
        required
        placeholder="Senha (mín. 8 caracteres)"
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
        {{ loading ? 'Criando...' : 'Criar conta' }}
      </button>
    </form>

    <RouterLink :to="{ name: 'login' }" class="text-center text-sm underline">
      Já tenho uma conta
    </RouterLink>
  </div>
</template>
