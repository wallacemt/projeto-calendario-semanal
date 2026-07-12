import { createRouter, createWebHistory } from 'vue-router'
import ForgotPasswordView from '../features/auth/views/ForgotPasswordView.vue'
import LoginView from '../features/auth/views/LoginView.vue'
import OAuthCallbackView from '../features/auth/views/OAuthCallbackView.vue'
import RegisterView from '../features/auth/views/RegisterView.vue'
import ResetPasswordView from '../features/auth/views/ResetPasswordView.vue'
import VerifyEmailView from '../features/auth/views/VerifyEmailView.vue'
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
    { path: '/verify-email', name: 'verify-email', component: VerifyEmailView },
    { path: '/oauth-callback', name: 'oauth-callback', component: OAuthCallbackView },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Memoizado dentro da própria store (ver stores/auth.ts) — o boot do
  // App.vue (loading global) chama o mesmo restoreSession() em paralelo, e
  // os dois precisam compartilhar a mesma promise em voo, não disparar dois
  // refresh concorrentes.
  await auth.restoreSession()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})
