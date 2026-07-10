<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPasswordSchema } from '@aniweek/shared'
import { authApi } from '../api'
import { HttpError } from '../../../lib/http'

const route = useRoute()
const router = useRouter()

// LSF-2026-004: guardamos o token numa ref assim que a página monta e
// removemos o parâmetro da URL logo em seguida — ele não fica persistido no
// histórico do browser (aparece em "voltar", autocomplete, etc.) por mais
// tempo do que o necessário para o formulário usá-lo.
const token = ref(route.query.token as string)
void router.replace({ name: route.name ?? undefined, query: {} })

const password = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null

  if (password.value !== confirmPassword.value) {
    error.value = 'As senhas não coincidem'
    return
  }

  const parsed = resetPasswordSchema.safeParse({
    token: token.value,
    password: password.value,
  })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  loading.value = true
  try {
    await authApi.resetPassword(parsed.data)
    await router.push({ name: 'login', query: { reset: 'success' } })
  } catch (err) {
    // O backend cobre token inválido/expirado e conta só-OAuth (sem senha
    // para redefinir) com BadRequestException — a mensagem já vem pronta
    // para exibir, sem precisarmos distinguir os casos aqui no front.
    error.value = err instanceof HttpError ? err.message : 'Não foi possível redefinir a senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
    <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">Redefinir senha</h1>

    <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <input
        v-model="password"
        type="password"
        required
        placeholder="Nova senha (mín. 8 caracteres)"
        class="rounded border px-3 py-2 outline-none"
        :style="{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
      />
      <input
        v-model="confirmPassword"
        type="password"
        required
        placeholder="Confirmar nova senha"
        class="rounded border px-3 py-2 outline-none"
        :style="{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
      />

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <button
        type="submit"
        class="rounded px-3 py-2 font-medium disabled:opacity-60"
        :style="{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }"
      >
        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
      </button>

      <RouterLink :to="{ name: 'login' }" class="text-center text-sm underline">
        Voltar para o login
      </RouterLink>
    </form>
  </div>
</template>
