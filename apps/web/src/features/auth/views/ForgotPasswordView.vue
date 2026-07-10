<script setup lang="ts">
import { ref } from 'vue'
import { forgotPasswordSchema } from '@aniweek/shared'
import { authApi } from '../api'

const email = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const sent = ref(false)

async function onSubmit() {
  error.value = null

  const parsed = forgotPasswordSchema.safeParse({ email: email.value })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  loading.value = true
  try {
    await authApi.forgotPassword(parsed.data)
  } catch {
    // A API sempre responde 204 aqui (anti-enumeração de contas — ver
    // AuthService.forgotPassword no backend), então uma falha só chega até
    // aqui por queda de rede/servidor. Mesmo assim mostramos a mensagem
    // genérica de sucesso: nunca confirmamos ou negamos a existência do email.
  } finally {
    loading.value = false
    sent.value = true
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
    <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">Esqueci minha senha</h1>

    <template v-if="sent">
      <p class="text-sm" :style="{ color: 'var(--color-text)' }">
        Se existir uma conta com senha para esse email, enviamos um link de redefinição.
      </p>
      <RouterLink :to="{ name: 'login' }" class="text-center text-sm underline">
        Voltar para o login
      </RouterLink>
    </template>

    <form v-else class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <input
        v-model="email"
        type="email"
        required
        placeholder="Email"
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
        {{ loading ? 'Enviando...' : 'Enviar link de redefinição' }}
      </button>

      <RouterLink :to="{ name: 'login' }" class="text-center text-sm underline">
        Voltar para o login
      </RouterLink>
    </form>
  </div>
</template>
