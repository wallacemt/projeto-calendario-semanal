<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPasswordSchema } from '@aniweek/shared'
import { authApi } from '../api'
import { HttpError } from '../../../lib/http'
import AuthShell from '../components/AuthShell.vue'
import AuthTextField from '../components/AuthTextField.vue'
import AuthButton from '../components/AuthButton.vue'

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
  <AuthShell heroSubtitle="Escolha uma senha nova para voltar a acessar seu calendário.">
    <template #hero-title>Uma senha nova,<br />o mesmo calendário.</template>

    <div class="font-mono mb-2.5 text-[11.5px] tracking-[0.12em] text-(--brand-primary)">
      NOVA SENHA
    </div>
    <h1 class="font-display mb-2 text-[28px] font-extrabold text-(--ink-text)">Redefinir senha</h1>
    <p class="mb-6 text-[14.5px] text-(--ink-text-muted)">Escolha uma senha com pelo menos 8 caracteres.</p>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <AuthTextField
        id="password"
        v-model="password"
        type="password"
        label="Nova senha"
        autocomplete="new-password"
        placeholder="Mínimo 8 caracteres"
        required
      />
      <AuthTextField
        id="confirm-password"
        v-model="confirmPassword"
        type="password"
        label="Confirmar nova senha"
        autocomplete="new-password"
        placeholder="Repita a senha"
        required
      />

      <p v-if="error" class="text-sm text-(--ink-error)">{{ error }}</p>

      <AuthButton type="submit" :loading="loading" class="mt-1">
        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
      </AuthButton>
    </form>

    <p class="mt-6 text-center text-[13.5px] text-(--ink-text-muted)">
      <RouterLink :to="{ name: 'login' }" class="text-(--brand-primary) hover:text-(--brand-secondary)">
        Voltar para o login
      </RouterLink>
    </p>
  </AuthShell>
</template>
