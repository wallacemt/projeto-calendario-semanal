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
  // Nest manda corpo vazio (Content-Length: 0), não a string "null", quando
  // o handler retorna `null` com status 200 (ex.: GET /themes/active sem
  // tema ativo) — res.json() rejeita em body vazio ("Unexpected end of JSON
  // input"). Lendo como texto primeiro e só fazendo parse se não vier vazio
  // cobre os dois casos sem duplicar essa checagem em cada chamada da API.
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}

// Consumo de SSE (M10 — notificações em tempo real). Não usa EventSource
// nativo de propósito: EventSource não deixa setar header Authorization, só
// manda cookies — e o access token deste app vive em memória (Pinia), nunca
// em cookie (ADR-04). A alternativa mais comum (token na query string)
// vazaria o access token em log de acesso do servidor/histórico do browser;
// fetch + ReadableStream manda o Bearer normal, reaproveitando o mesmo
// accessToken/refreshHandler já usados por toda chamada REST deste client.
// Retorna uma função de cleanup (aborta a conexão) — chame no onUnmounted.
export function streamSse(path: string, onEvent: (rawData: string) => void): () => void {
  const controller = new AbortController()

  async function connect(skipAuthRetry = false): Promise<void> {
    let res: Response
    try {
      res = await fetch(`${API_URL}${path}`, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        signal: controller.signal,
      })
    } catch {
      return // rede caiu ou a conexão foi abortada (unmount) — sem retry aqui
    }

    if (res.status === 401 && !skipAuthRetry && refreshHandler) {
      const newToken = await refreshHandler()
      if (newToken) return connect(true)
    }
    if (!res.ok || !res.body) return

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      buffer += decoder.decode(value, { stream: true })
      // Frame SSE = bloco terminado em linha em branco ("\n\n"); a última
      // fatia do split pode ser um frame incompleto, sobra pro buffer.
      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''
      for (const frame of frames) {
        const dataLine = frame.split('\n').find((line) => line.startsWith('data:'))
        if (dataLine) onEvent(dataLine.slice(5).trim())
      }
    }
  }

  void connect()
  return () => controller.abort()
}
