import { defineStore } from "pinia";
import type { AnimeDto } from "@aniweek/shared";
import { HttpError } from "../../lib/http";
import { discoverApi, type AnimeFilter } from "./api";

export const useDiscoverStore = defineStore("discover", {
  state: () => ({
    query: "",
    filter: "all" as AnimeFilter,
    results: [] as AnimeDto[],
    selected: null as AnimeDto | null,
    loading: false,
    searched: false,
    error: null as string | null,
    mode: "season" as "season" | "search",
    page: 1,
    hasNextPage: false,
    lastPage: null as number | null,
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
      this.searched = true;
      await this.fetchPage(1);
    },

    setFilter(filter: AnimeFilter) {
      this.filter = filter;
      if (this.query.trim()) this.search(this.query);
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
            ? await discoverApi.search(this.query, page, this.filter)
            : await discoverApi.seasonNow(page);
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
        // Jikan pode ficar fora do ar (§12 do blueprint) — sem isso, um 503
        // vira silenciosamente "nenhum resultado encontrado", que é enganoso:
        // o usuário acha que o termo não existe quando na verdade a busca nem rodou.
        if (page === 1) this.results = [];
        this.error =
          err instanceof HttpError ? err.message : "Erro ao buscar animes";
      } finally {
        if (requestId === this.requestId) this.loading = false;
      }
    },
  },
});
