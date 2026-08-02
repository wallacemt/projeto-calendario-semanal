import { defineStore } from "pinia";
import type { LoginInput, RegisterInput } from "@aniweek/shared";
import { authApi, type PublicUser } from "../features/auth/api";
import { setAccessToken, setRefreshHandler } from "../lib/http";

// Módulo-escopo (não state do Pinia): sobrevive a re-renders mas reseta
// naturalmente num reload real de página, que é exatamente o momento em que
// uma nova restauração faz sentido.
let restoreSessionPromise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as PublicUser | null,
    // Access token só em memória (Pinia) — nunca localStorage (ADR-04).
    accessToken: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) =>
      state.accessToken !== null && state.user !== null,
  },
  actions: {
    async register(input: RegisterInput) {
      const { user, accessToken } = await authApi.register(input);
      this.setSession(user, accessToken);
    },

    async login(input: LoginInput) {
      const { user, accessToken } = await authApi.login(input);
      this.setSession(user, accessToken);
    },

    async logout() {
      // Best-effort: mesmo se a chamada de rede falhar, limpa a sessão local.
      await authApi.logout().catch(() => undefined);
      this.clearSession();
    },

    /** Troca o refresh cookie por um novo access token. Retorna null se a sessão não é mais válida. */
    async refresh(): Promise<string | null> {
      try {
        const { accessToken } = await authApi.refresh();
        this.accessToken = accessToken;
        setAccessToken(accessToken);
        return accessToken;
      } catch {
        this.clearSession();
        return null;
      }
    },

    // Chamada tanto pelo guard global do router quanto pelo boot do App.vue
    // (loading global) — memoizada aqui, não no chamador: os dois lados
    // precisam do MESMO restore em voo, nunca de dois. Dois refresh
    // concorrentes mandariam o mesmo cookie de refresh duas vezes; a
    // detecção de reuso do backend (rotação de refresh) veria a segunda
    // chamada como reuso de um token já consumido e revogaria a sessão
    // inteira no primeiro carregamento de página.
    restoreSession(): Promise<void> {
      restoreSessionPromise ??= this.restoreSessionOnce();
      return restoreSessionPromise;
    },

    async restoreSessionOnce(): Promise<void> {
      const accessToken = await this.refresh();
      if (!accessToken) return;
      try {
        this.user = await authApi.me();
      } catch {
        this.clearSession();
      }
    },

    setSession(user: PublicUser, accessToken: string) {
      this.user = user;
      this.accessToken = accessToken;
      setAccessToken(accessToken);
    },

    clearSession() {
      this.user = null;
      this.accessToken = null;
      setAccessToken(null);
    },
  },
});

// Fecha o ciclo 401→refresh→retry do http client (ver lib/http.ts). Chamado
// uma vez no main.ts, logo após `app.use(pinia)`.
export function bindAuthRefreshHandler(): void {
  const store = useAuthStore();
  setRefreshHandler(() => store.refresh());
}
