// Cliente HTTP fino sobre fetch nativo (ADR-04): injeta o access token em
// memória e, em um 401, chama automaticamente o refresh handler (registrado
// pela store de auth) e repete a request uma única vez. Sem dependência
// nova — fetch nativo é suficiente para o volume de chamadas do app.

import { env } from './env'

const API_URL = env.VITE_API_URL

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Pula o retry automático via refresh — usado nas próprias rotas de auth. */
  skipAuthRetry?: boolean
}

let accessToken: string | null = null
export function setAccessToken(token: string | null): void {
  accessToken = token
}

type RefreshHandler = () => Promise<string | null>
let refreshHandler: RefreshHandler | null = null
/** Chamado uma vez pela store de auth (ver stores/auth.ts) para fechar o ciclo 401→refresh→retry. */
export function setRefreshHandler(handler: RefreshHandler): void {
  refreshHandler = handler
}

async function parseErrorMessage(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: string | string[] }
    return Array.isArray(message) ? message.join(', ') : message
  }
  return res.statusText || 'Erro inesperado'
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options

  // FormData (upload de avatar) precisa que o browser gere o próprio
  // Content-Type com boundary — setar 'application/json' (ou qualquer valor
  // fixo) na mão quebra o parse multipart no servidor.
  const isFormData = body instanceof FormData

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    // Cookie de refresh httpOnly precisa viajar nas requests — ADR-04.
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !skipAuthRetry && refreshHandler) {
    const newToken = await refreshHandler()
    if (newToken) {
      return request<T>(path, { ...options, skipAuthRetry: true })
    }
  }

  if (!res.ok) {
    throw new HttpError(res.status, await parseErrorMessage(res))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}
