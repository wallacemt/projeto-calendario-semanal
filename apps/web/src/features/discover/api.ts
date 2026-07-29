import type {
  AnimeDto,
  AnimeFullDto,
  PaginatedAnimeDto,
} from "@aniweek/shared";
import { http } from "../../lib/http";

export type AnimeFilter = "all" | "tv" | "movie" | "airing" | "top";

const FILTER_PARAMS: Record<AnimeFilter, Record<string, string>> = {
  all: {},
  tv: { type: "tv" },
  movie: { type: "movie" },
  airing: { status: "airing" },
  top: { orderBy: "score" },
};

export const discoverApi = {
  search: (query: string, page: number, filter: AnimeFilter) => {
    const params = new URLSearchParams({
      query,
      page: String(page),
      ...FILTER_PARAMS[filter],
    }).toString();
    return http.get<PaginatedAnimeDto>(`/animes/search?${params}`);
  },
  detail: (malId: number) => http.get<AnimeDto>(`/animes/${malId}`),
  fullDetail: (malId: number) =>
    http.get<AnimeFullDto>(`/animes/${malId}/full`),

  seasonNow: (page: number, filter: AnimeFilter) => {
    const params = new URLSearchParams({
      page: String(page),
      ...FILTER_PARAMS[filter],
    }).toString();
    return http.get<PaginatedAnimeDto>(`/animes/season/now?${params}`);
  },
};
