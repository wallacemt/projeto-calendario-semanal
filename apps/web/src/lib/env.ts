// Valida as env vars do build assim que este módulo é importado — se
// VITE_API_URL não estiver presente/for inválida, o app quebra alto (erro no
// console/tela) em vez de cair num fallback silencioso pra localhost.
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
})

export const env = envSchema.parse(import.meta.env)
