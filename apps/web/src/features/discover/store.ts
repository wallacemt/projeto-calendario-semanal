import { defineStore } from "pinia";
import type { AnimeDto, CommunityPopularItem } from "@aniweek/shared";
import { HttpError } from "../../lib/http";
import { useToastStore } from "../../stores/toast";
import { discoverApi, type AnimeFilter } from "./api";

export const useDiscoverStore = defineStore("discover", {
  state: () => ({
    query: "",
    filter: "all" as AnimeFilter,
    genre: null as string | null,
    results: [] as AnimeDto[],
    selected: null as AnimeDto | null,
    loading: false,
    searched: false,
    error: null as string | null,
    mode: "season" as "season" | "search",
    page: 1,
    hasNextPage: false,
    lastPage: null as number | null,
    communityPopular: [] as CommunityPopularItem[],
    communityLoading: false,
    // Incrementado a cada fetch disparado; uma resposta só é aplicada se
    // ainda for a mais recente. Sem isso, digitar rápido pode fazer uma
    // request antiga (que demorou mais) sobrescrever o resultado de uma
    // busca mais nova que voltou primeiro — clássico race condition de
    // typeahead (a mesma razão pra usar AbortController em produção).
    requestId: 0,
  }),
  actions: {
    async search(query: string) {
      this.query = query;
      this.selected = null;
      if (!query.trim()) {
        await this.getSeasonNow();
        return;
      }
      this.mode = "search";
      await this.fetchPage(1);
    },

    // Antes só reexecutava a busca por texto (if query.trim()) — no modo
    // "temporada vigente" (tela ao abrir, sem termo digitado), clicar num
    // chip de filtro não tinha efeito nenhum, porque nada disparava um novo
    // fetchPage. `mode` já diz qual dos dois fetches (search/season) está
    // ativo, então reexecuta o que for o caso.
    setFilter(filter: AnimeFilter) {
      this.filter = filter;
      if (this.mode === "search") this.search(this.query);
      else this.getSeasonNow();
    },

    // Mesma lógica do setFilter: gênero também reexecuta o fetch ativo
    // (busca ou temporada), e refaz o painel de populares na comunidade
    // (esse não tem paginação/mode, é sempre um fetch único).
    setGenre(genre: string | null) {
      this.genre = genre;
      if (this.mode === "search") this.search(this.query);
      else this.getSeasonNow();
      this.fetchCommunityPopular();
    },

    async fetchCommunityPopular() {
      this.communityLoading = true;
      try {
        this.communityPopular = await discoverApi.communityPopular(this.genre);
      } catch {
        this.communityPopular = [];
      } finally {
        this.communityLoading = false;
      }
    },

    select(anime: AnimeDto) {
      this.selected = anime;
    },

    clearSelection() {
      this.selected = null;
    },

    async getSeasonNow() {
      this.mode = "season";
      this.searched = false;
      this.selected = null;
      await this.fetchPage(1);
    },

    async loadMore() {
      if (!this.hasNextPage || this.loading) return;
      await this.fetchPage(this.page + 1);
    },

    async fetchPage(page: number) {
      const requestId = ++this.requestId;
      this.loading = true;
      this.error = null;
      try {
        const { data, hasNextPage, lastPage } =
          this.mode === "search"
            ? await discoverApi.search(this.query, page, this.filter, this.genre)
            : await discoverApi.seasonNow(page, this.filter, this.genre);
        if (requestId !== this.requestId) return; // resposta obsoleta, ignora
        // page 1 é sempre uma busca/temporada nova (troca de termo, filtro ou
        // reload) — substitui o resultado. Só "carregar mais" (loadMore, que
        // chama fetchPage com page > 1) deve acumular. Sem essa distinção, uma
        // nova busca concatenava por cima da anterior e duplicava cards.
        // O dedupe por malId (defesa extra, além do backend em jikan.service.ts)
        // cobre o caso de "carregar mais" trazer um item que já apareceu numa
        // página anterior — listas paginadas ao vivo podem sofrer esse drift
        // se o conjunto de dados mudar entre uma chamada e outra.
        if (page === 1) {
          this.results = data;
        } else {
          const existingIds = new Set(this.results.map((anime) => anime.malId));
          this.results = [
            ...this.results,
            ...data.filter((anime) => !existingIds.has(anime.malId)),
          ];
        }
        this.hasNextPage = hasNextPage;
        this.lastPage = lastPage;
        this.page = page;
      } catch (err) {
        if (requestId !== this.requestId) return;
        const message =
          err instanceof HttpError ? err.message : "Erro ao buscar animes";
        // page 1 sem nenhum resultado ainda em tela: não tem o que renderizar,
        // então é a view (v-else-if="store.error") que mostra o estado de erro
        // cheio. Jikan pode ficar fora do ar (§12 do blueprint) — sem isso, um
        // 503 vira silenciosamente "nenhum resultado encontrado", que é
        // enganoso: o usuário acha que o termo não existe quando na verdade a
        // busca nem rodou.
        //
        // "Carregar mais" (page > 1) falhando não deve derrubar a grade que já
        // está na tela — só avisa via toast e mantém os resultados anteriores.
        if (page === 1) {
          this.results = [];
          this.error = message;
        } else {
          useToastStore().push(message);
        }
      } finally {
        if (requestId === this.requestId) this.loading = false;
        if( this.mode === "search") this.searched = false;
      }
    },
  },
});
