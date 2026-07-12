<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-vue-next'
import { verifyEmailSchema } from '@aniweek/shared'
import { authApi } from '../api'
import { HttpError } from '../../../lib/http'
import AuthShell from '../components/AuthShell.vue'
import AuthButton from '../components/AuthButton.vue'

const route = useRoute()
const router = useRouter()

// LSF-2026-004: mesmo tratamento do reset-password — capturamos o token da
// query assim que a página monta e removemos o parâmetro da URL logo em
// seguida, para ele não ficar persistido no histórico do browser por mais
// tempo do que o necessário.
const token = ref(route.query.token as string | undefined)
void router.replace({ name: route.name ?? undefined, query: {} })

type Status = 'verifying' | 'success' | 'error'

const status = ref<Status>('verifying')
const error = ref<string | null>(null)

async function verify() {
  const parsed = verifyEmailSchema.safeParse({ token: token.value })
  if (!parsed.success) {
    status.value = 'error'
    error.value = 'Link de verificação inválido.'
    return
  }

  try {
    await authApi.verifyEmail(parsed.data)
    status.value = 'success'
  } catch (err) {
    // O backend cobre token inválido/expirado com BadRequestException — a
    // mensagem já vem pronta para exibir, sem distinguirmos os casos aqui.
    status.value = 'error'
    error.value = err instanceof HttpError ? err.message : 'Não foi possível verificar o e-mail.'
  }
}

onMounted(verify)
</script>

<template>
  <AuthShell heroSubtitle="Falta pouco: confirme seu e-mail para liberar os recursos que dependem dele.">
    <template #hero-title>Só mais<br />um passo.</template>

    <div class="flex flex-col items-center py-6 text-center">
      <div
        class="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
        :class="{
          'bg-white/6': status === 'verifying',
          'bg-[color-mix(in_srgb,var(--color-success)_18%,transparent)]': status === 'success',
          'bg-[color-mix(in_srgb,var(--ink-error)_18%,transparent)]': status === 'error',
        }"
      >
        <LoaderCircle v-if="status === 'verifying'" class="h-6 w-6 animate-spin text-(--ink-text-muted)" />
        <CheckCircle2 v-else-if="status === 'success'" class="h-7 w-7 text-(--color-success)" />
        <XCircle v-else class="h-7 w-7 text-(--ink-error)" />
      </div>

      <h1 class="font-display mb-2 text-[22px] font-extrabold text-(--ink-text)">
        <template v-if="status === 'verifying'">Verificando seu e-mail...</template>
        <template v-else-if="status === 'success'">E-mail verificado!</template>
        <template v-else>Não foi possível verificar</template>
      </h1>
      <p class="mb-6 max-w-[280px] text-[14.5px] text-(--ink-text-muted)">
        <template v-if="status === 'verifying'">Isso leva só um instante.</template>
        <template v-else-if="status === 'success'">
          Sua conta já está com o e-mail confirmado.
        </template>
        <template v-else>{{ error }}</template>
      </p>

      <AuthButton v-if="status !== 'verifying'" class="max-w-[220px]" @click="router.push({ name: 'login' })">
        {{ status === 'success' ? 'Ir para o login' : 'Voltar para o login' }}
      </AuthButton>
    </div>
  </AuthShell>
</template>
