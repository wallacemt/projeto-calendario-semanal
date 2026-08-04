<script setup lang="ts">
import { ref } from 'vue'
import { forgotPasswordSchema } from '@aniweek/shared'
import { authApi } from '../api'
import AuthShell from '../components/AuthShell.vue'
import AuthTextField from '../components/AuthTextField.vue'
import AuthButton from '../components/AuthButton.vue'

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
  <AuthShell heroSubtitle="Sem estresse: te mandamos um link seguro pra voltar a acessar sua conta.">
    <template #hero-title>Acontece até<br />no melhor arco.</template>

    <div class="font-mono mb-2.5 text-[11.5px] tracking-[0.12em] text-(--brand-primary)">
      RECUPERAR ACESSO
    </div>
    <h1 class="font-display mb-2 text-[28px] font-extrabold text-(--ink-text)">
      Esqueci minha senha
    </h1>

    <template v-if="sent">
      <p class="mb-6 text-[14.5px] text-(--ink-text-muted)">
        Se existir uma conta com senha para esse e-mail, enviamos um link de redefinição — confira
        também a caixa de spam.
      </p>
      <RouterLink :to="{ name: 'login' }" class="text-(--brand-primary) hover:text-(--brand-secondary) text-[13.5px]">
        Voltar para o login
      </RouterLink>
    </template>

    <template v-else>
      <p class="mb-6 text-[14.5px] text-(--ink-text-muted)">
        Informe o e-mail da sua conta e enviamos um link de redefinição.
      </p>

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

        <p v-if="error" class="text-sm text-(--ink-error)">{{ error }}</p>

        <AuthButton type="submit" :loading="loading" class="mt-1">
          {{ loading ? 'Enviando...' : 'Enviar link de redefinição' }}
        </AuthButton>
      </form>

      <p class="mt-6 text-center text-[13.5px] text-(--ink-text-muted)">
        <RouterLink :to="{ name: 'login' }" class="text-(--brand-primary) hover:text-(--brand-secondary)">
          Voltar para o login
        </RouterLink>
      </p>
    </template>
  </AuthShell>
</template>
