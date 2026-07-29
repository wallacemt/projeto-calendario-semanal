import type {
  Anime,
  Season,
  WatchedAnime,
} from '../../../generated/prisma/client';

export interface WatchedAnimeResponse {
  id: string;
  rating: number | null;
  comment: string | null;
  completedAt: Date;
  watchedSeason: Season | null;
  watchedYear: number | null;
  featured: boolean;
  anime: {
    id: string;
    malId: number;
    title: string;
    imageUrl: string | null;
    episodes: number | null;
    genres: string[];
  };
}

// featuredId vem de fora (MuseumService já resolveu o "auto vs. pinado" —
// ver resolveFeaturedId) em vez de o mapper decidir sozinho: ele só espelha
// um dado, não tem acesso ao User pra saber quem está em destaque.
export function toWatchedAnimeResponse(
  watched: WatchedAnime & { anime: Anime },
  featuredId: string | null,
): WatchedAnimeResponse {
  return {
    id: watched.id,
    rating: watched.rating,
    comment: watched.comment,
    completedAt: watched.completedAt,
    watchedSeason: watched.watchedSeason,
    watchedYear: watched.watchedYear,
    featured: watched.id === featuredId,
    anime: {
      id: watched.anime.id,
      malId: watched.anime.malId,
      title: watched.anime.title,
      imageUrl: watched.anime.imageUrl,
      episodes: watched.anime.episodes,
      genres: Array.isArray(watched.anime.genres)
        ? (watched.anime.genres as string[])
        : [],
    },
  };
}
