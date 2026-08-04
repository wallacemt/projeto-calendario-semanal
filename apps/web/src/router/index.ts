import { createRouter, createWebHistory } from "vue-router";
import ForgotPasswordView from "../features/auth/views/ForgotPasswordView.vue";
import LoginView from "../features/auth/views/LoginView.vue";
import OAuthCallbackView from "../features/auth/views/OAuthCallbackView.vue";
import RegisterView from "../features/auth/views/RegisterView.vue";
import ResetPasswordView from "../features/auth/views/ResetPasswordView.vue";
import VerifyEmailView from "../features/auth/views/VerifyEmailView.vue";
import CalendarView from "../features/calendar/views/CalendarView.vue";
import AnimeDetailView from "../features/discover/views/AnimeDetailView.vue";
import DiscoverView from "../features/discover/views/DiscoverView.vue";
import MuseumView from "../features/museum/views/MuseumView.vue";
import StatsView from "../features/museum/views/StatsView.vue";
import ProfileView from "../features/profile/views/ProfileView.vue";
import SharedCalendarView from "../features/social/views/SharedCalendarView.vue";
import SocialView from "../features/social/views/SocialView.vue";
import UserProfileView from "../features/social/views/UserProfileView.vue";
import ThemeEditorView from "../features/theme/views/ThemeEditorView.vue";
import { useAuthStore } from "../stores/auth";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: CalendarView,
      meta: { requiresAuth: true },
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
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if ((to.name === "login" || to.name === "register") && auth.isAuthenticated) {
    return { name: "home" };
  }
 
  return true;
});
