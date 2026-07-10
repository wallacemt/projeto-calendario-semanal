import { createRouter, createWebHistory } from 'vue-router'
import ForgotPasswordView from '../features/auth/views/ForgotPasswordView.vue'
import LoginView from '../features/auth/views/LoginView.vue'
import OAuthCallbackView from '../features/auth/views/OAuthCallbackView.vue'
import RegisterView from '../features/auth/views/RegisterView.vue'
import ResetPasswordView from '../features/auth/views/ResetPasswordView.vue'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
    { path: '/oauth-callback', name: 'oauth-callback', component: OAuthCallbackView },
  ],
})

// Memoiza a restauração de sessão por carregamento de página: o access token
// só existe em memória (ADR-04), então cada reload precisa trocar o cookie
// de refresh por um novo antes da primeira navegação decidir se redireciona.
let sessionRestored: Promise<void> | null = null

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  sessionRestored ??= auth.restoreSession()
  await sessionRestored

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})
