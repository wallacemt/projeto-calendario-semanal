import { createRouter, createWebHistory } from "vue-router";
import ForgotPasswordView from "../features/auth/views/ForgotPasswordView.vue";
import LoginView from "../features/auth/views/LoginView.vue";
import OAuthCallbackView from "../features/auth/views/OAuthCallbackView.vue";
import RegisterView from "../features/auth/views/RegisterView.vue";
import ResetPasswordView from "../features/auth/views/ResetPasswordView.vue";
import VerifyEmailView from "../features/auth/views/VerifyEmailView.vue";
import AnimeDetailView from "../features/discover/views/AnimeDetailView.vue";
import DiscoverView from "../features/discover/views/DiscoverView.vue";
import RootView from "../features/landing/views/RootView.vue";
import PrivacyView from "../features/legal/views/PrivacyView.vue";
import MuseumView from "../features/museum/views/MuseumView.vue";
import StatsView from "../features/museum/views/StatsView.vue";
import ProfileView from "../features/profile/views/ProfileView.vue";
import SharedCalendarView from "../features/social/views/SharedCalendarView.vue";
import SocialView from "../features/social/views/SocialView.vue";
import UserProfileView from "../features/social/views/UserProfileView.vue";
import { SYSTEM_STATES } from "../features/system/config";
import SystemStateView from "../features/system/views/SystemStateView.vue";
import ThemeEditorView from "../features/theme/views/ThemeEditorView.vue";
import { hadPriorSession, useAuthStore } from "../stores/auth";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Sem requiresAuth: RootView decide entre Landing (guest) e Calendar
    // (autenticado) em runtime — ver features/landing/views/RootView.vue e a
    // auditoria SEO (a home não pode mais redirecionar direto pro /login).
    {
      path: "/",
      name: "home",
      component: RootView,
    },
    {
      path: "/privacidade",
      name: "privacy",
      component: PrivacyView,
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: "/themes",
      name: "themes",
      component: ThemeEditorView,
      meta: { requiresAuth: true },
    },
    {
      path: "/museu",
      name: "museum",
      component: MuseumView,
      meta: { requiresAuth: true },
    },
    {
      path: "/estatisticas",
      name: "stats",
      component: StatsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/discover",
      name: "discover",
      component: DiscoverView,
      meta: { requiresAuth: true },
    },
    {
      path: "/social",
      name: "social",
      component: SocialView,
      meta: { requiresAuth: true },
    },
    {
      path: "/u/:username",
      name: "user-profile",
      component: UserProfileView,
      meta: { requiresAuth: true },
    },
    // Público — sem requiresAuth: é a página que quem RECEBEU o link acessa,
    // logado ou não (ver SharedCalendarView, que resolve o próprio 404/redirect).
    {
      path: "/c/:token",
      name: "shared-calendar",
      component: SharedCalendarView,
    },
    {
      path: "/discover/:malId",
      name: "anime-detail",
      component: AnimeDetailView,
      meta: { requiresAuth: true },
    },
    { path: "/login", name: "login", component: LoginView },
    { path: "/register", name: "register", component: RegisterView },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPasswordView,
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: ResetPasswordView,
    },
    { path: "/verify-email", name: "verify-email", component: VerifyEmailView },
    {
      path: "/oauth-callback",
      name: "oauth-callback",
      component: OAuthCallbackView,
    },
    {
      path: "/manutencao",
      name: "maintenance",
      component: SystemStateView,
      props: SYSTEM_STATES.maintenance,
    },
    {
      path: "/sessao-expirada",
      name: "session-expired",
      component: SystemStateView,
      props: SYSTEM_STATES.sessionExpired,
    },
    {
      path: "/erro/403",
      name: "forbidden",
      component: SystemStateView,
      props: SYSTEM_STATES.forbidden,
    },
    {
      path: "/erro/500",
      name: "server-error",
      component: SystemStateView,
      props: SYSTEM_STATES.serverError,
    },
    // Catch-all — precisa ser o último da lista (vue-router casa em ordem).
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: SystemStateView,
      props: SYSTEM_STATES.notFound,
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  // Memoizado dentro da própria store (ver stores/auth.ts) — o boot do
  // App.vue (loading global) chama o mesmo restoreSession() em paralelo, e
  // os dois precisam compartilhar a mesma promise em voo, não disparar dois
  // refresh concorrentes.
  await auth.restoreSession();
 
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // hadPriorSession distingue "nunca logou" de "sessão expirou" (ver
    // stores/auth.ts) — só o segundo caso manda pra /sessao-expirada.
    if (hadPriorSession()) return { name: "session-expired" };
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if ((to.name === "login" || to.name === "register") && auth.isAuthenticated) {
    return { name: "home" };
  }
 
  return true;
});
