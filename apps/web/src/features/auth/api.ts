import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@aniweek/shared'
import { http } from '../../lib/http'

export interface PublicUser {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  bio: string | null
  emailVerified: boolean
  createdAt: string
}

export interface AuthResponse {
  user: PublicUser
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

// As rotas de auth nunca devem disparar o retry automático do http client:
// um 401 aqui é "credenciais inválidas"/"token expirado", nunca "access
// token do usuário logado expirou" — ver lib/http.ts.
export const authApi = {
  register: (input: RegisterInput) =>
    http.post<AuthResponse>('/auth/register', input, { skipAuthRetry: true }),
  login: (input: LoginInput) =>
    http.post<AuthResponse>('/auth/login', input, { skipAuthRetry: true }),
  refresh: () => http.post<RefreshResponse>('/auth/refresh', undefined, { skipAuthRetry: true }),
  logout: () => http.post<void>('/auth/logout', undefined, { skipAuthRetry: true }),
  me: () => http.get<PublicUser>('/auth/me'),
  verifyEmail: (input: VerifyEmailInput) =>
    http.post<void>('/auth/verify-email', input, { skipAuthRetry: true }),
  forgotPassword: (input: ForgotPasswordInput) =>
    http.post<void>('/auth/forgot-password', input, { skipAuthRetry: true }),
  resetPassword: (input: ResetPasswordInput) =>
    http.post<void>('/auth/reset-password', input, { skipAuthRetry: true }),
}
