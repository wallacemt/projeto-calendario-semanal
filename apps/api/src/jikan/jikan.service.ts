import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type Redis from 'ioredis';
import {
  animeDtoSchema,
  animeFullDtoSchema,
  type AnimeDto,
  type AnimeFullDto,
  type PaginatedAnimeDto,
  type SearchAnimesQuery,
} from '@aniweek/shared';
import { REDIS_CLIENT } from '../common/redis/redis.module';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
// Jikan é público e sem key: o limite documentado é ~3 req/s. 400ms entre
// chamadas dá uma margem de segurança (~2.5 req/s) — mesma ideia de um
// token bucket, só que simplificado para "1 req por vez, com intervalo
// mínimo", que é suficiente para um único processo Nest (RNF-01: dezenas de
// usuários, não precisa de um limiter distribuído).
const MIN_INTERVAL_MS = 400;
const SEARCH_CACHE_TTL_SECONDS = 60 * 60; // 1h — ADR-06
const DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — ADR-06
// Jikan é ele mesmo um proxy pro MyAnimeList: um 502/503/504 costuma ser uma
// falha pontual do upstream (MAL), não do Jikan em si — vale a pena tentar
// de novo. Backoff exponencial (500ms, 1s, 2s) em vez de retry imediato pra
// não martelar um serviço que já está com problema (ADR-06).
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;
// Sem timeout, uma conexão que trava (rede instável, NAT de container/WSL —
// mesmo cenário do comentário em main.ts) fica presa indefinidamente no
// fetch, e como as chamadas ao Jikan são serializadas numa fila única
// (this.queue), essa única requisição travada bloqueia todas as outras atrás
// dela. O catch(() => null) já existente trata abort como falha de rede
// transitória (retry com backoff) — só faltava um teto de tempo por tentativa.
const REQUEST_TIMEOUT_MS = 8_000;

interface JikanListRaw {
  data: JikanAnimeRaw[];
  pagination: {
    has_next_page: boolean;
    current_page: number;
    last_visible_page?: number | null;
  };
}

interface JikanAnimeRaw {
  mal_id: number;
  title: string;
  images?: { jpg?: { image_url?: string; large_image_url?: string } };
  synopsis: string | null;
  episodes: number | null;
  genres?: { name: string }[];
  url: string | null;
  type: string | null;
  year: number | null;
  score: number | null;
  status: string | null;
  aired?: { prop?: { from?: { year?: number | null } } };
}

// Shape do endpoint /anime/{id}/full — só usado na página de detalhe
// (AnimeFullDto). Bem mais pesado que JikanAnimeRaw, então tem cache e
// chamada Jikan próprios (getAnimeFullById), separados do getAnimeById usado
// pelo card/painel lateral.
interface JikanAnimeFullRaw extends Omit<JikanAnimeRaw, 'aired'> {
  title_english: string | null;
  title_japanese: string | null;
  trailer?: {
    url?: string | null;
    embed_url?: string | null;
    images?: { large_image_url?: string | null };
  };
  background: string | null;
  source: string | null;
  duration: string | null;
  rating: string | null;
  season: string | null;
  aired?: {
    string?: string | null;
    prop?: { from?: { year?: number | null } };
  };
  broadcast?: { string?: string | null };
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  studios?: { name: string }[];
  producers?: { name: string }[];
  licensors?: { name: string }[];
  relations?: {
    relation: string;
    entry: { mal_id: number; type: string; name: string }[];
  }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Anticorrupção (ADR-06): único ponto do backend que fala com o Jikan. Faz
// rate limiting, cache (Redis, degrada para "sem cache" se REDIS_URL não
// estiver configurada) e mapeia a resposta crua para o nosso AnimeDto — quem
// consome este service nunca vê o shape do Jikan.
@Injectable()
export class JikanService {
  private readonly logger = new Logger(JikanService.name);
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async searchAnime(input: SearchAnimesQuery): Promise<PaginatedAnimeDto> {
    const cacheKey = `jikan:search:${input.query.toLowerCase()}:${input.page}:${input.type ?? ''}:${input.status ?? ''}:${input.orderBy ?? ''}`;
    const cached = await this.readCache<PaginatedAnimeDto>(cacheKey);
    if (cached) return cached;

    const params: Record<string, string> = {
      q: input.query,
      page: String(input.page),
    };
    if (input.type) params.type = input.type;
    if (input.status) params.status = input.status;
    if (input.orderBy === 'score') {
      params.order_by = 'score';
      params.sort = 'desc';
    }
    const raw = await this.fetchJikan<JikanListRaw>('/anime', params);
    const result = mapJikanList(raw);
    await this.writeCache(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
    return result;
  }

  async getAnimeById(malId: number): Promise<AnimeDto> {
    const cacheKey = `jikan:anime:${malId}`;
    const cached = await this.readCache<AnimeDto>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchJikan<{ data: JikanAnimeRaw }>(
      `/anime/${malId}`,
    );
    const result = mapJikanAnime(raw.data);
    await this.writeCache(cacheKey, result, DETAIL_CACHE_TTL_SECONDS);
    return result;
  }

  async getAnimeFullById(malId: number): Promise<AnimeFullDto> {
    const cacheKey = `jikan:anime:full:${malId}`;
    const cached = await this.readCache<AnimeFullDto>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchJikan<{ data: JikanAnimeFullRaw }>(
      `/anime/${malId}/full`,
    );
    const result = mapJikanAnimeFull(raw.data);
    await this.writeCache(cacheKey, result, DETAIL_CACHE_TTL_SECONDS);
    return result;
  }

  async getByCurrentSeson(page: number): Promise<PaginatedAnimeDto> {
    const cacheKey = `jikan:seasonNowAnimes:${page}`;
    const cached = await this.readCache<PaginatedAnimeDto>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchJikan<JikanListRaw>('/seasons/now', {
      page: String(page),
    });
    const result = mapJikanList(raw);
    await this.writeCache(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
    return result;
  }
  private async readCache<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  private async writeCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  // Retry (429/5xx/rede) fica FORA da fila — só o disparo em si (dispatch)
  // entra nela. Antes, uma chamada com retry recursava dentro do próprio
  // `.then` da fila, então o sleep de backoff "segurava" o lugar: qualquer
  // outra chamada (outro endpoint, outro request do usuário) ficava presa
  // atrás dos até 3 retries dela — pior caso ~27s (3 × até 8s de timeout +
  // backoff) de fila travada por uma única falha. Com o backoff fora da fila,
  // uma busca nova disparada nesse meio-tempo entra e roda no turno dela
  // normalmente, sem esperar o retry de outra chamada terminar.
  private async fetchJikan<T>(
    path: string,
    params?: Record<string, string>,
    attempt = 0,
  ): Promise<T> {
    const { res, retryAfterHeader } = await this.dispatch(path, params);

    if (res?.status === 429 && attempt < MAX_RETRIES) {
      const retryAfterSeconds = Number(retryAfterHeader) || 1;
      this.logger.warn(`Jikan 429 — retry em ${retryAfterSeconds}s`);
      await sleep(retryAfterSeconds * 1000);
      return this.fetchJikan<T>(path, params, attempt + 1);
    }

    const isTransientFailure = !res || res.status > 500;
    if (isTransientFailure && attempt < MAX_RETRIES) {
      const delayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
      this.logger.warn(
        `Jikan ${res?.status ?? 'network error'} — retry em ${delayMs}ms (tentativa ${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(delayMs);
      return this.fetchJikan<T>(path, params, attempt + 1);
    }

    if (!res || !res.ok)
      throw new ServiceUnavailableException('Jikan indisponível no momento');
    return res.json() as Promise<T>;
  }

  // Só o disparo passa pela fila — é o único trecho que precisa do intervalo
  // mínimo entre chamadas (o "token bucket" simplificado do comentário acima
  // do MIN_INTERVAL_MS). Cada entrada na fila é uma tentativa isolada; quem
  // decide se tenta de novo é o fetchJikan, já fora dela.
  private dispatch(
    path: string,
    params?: Record<string, string>,
  ): Promise<{ res: Response | null; retryAfterHeader: string | null }> {
    const run = this.queue.then(() => this.singleAttempt(path, params));
    // isola falhas: uma requisição que falhou não deve travar a fila para as próximas
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async singleAttempt(
    path: string,
    params?: Record<string, string>,
  ): Promise<{ res: Response | null; retryAfterHeader: string | null }> {
    const wait = this.lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();

    const url = new URL(JIKAN_BASE_URL + path);
    for (const [key, value] of Object.entries(params ?? {}))
      url.searchParams.set(key, value);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }).catch(() => null);

    return { res, retryAfterHeader: res?.headers.get('retry-after') ?? null };
  }
}

function mapJikanList(raw: JikanListRaw): PaginatedAnimeDto {
  return {
    data: dedupeByMalId(raw.data).map((item) => mapJikanAnime(item)),
    hasNextPage: raw.pagination.has_next_page,
    currentPage: raw.pagination.current_page,
    lastPage: raw.pagination.last_visible_page ?? null,
  };
}

// O próprio Jikan repete o mesmo mal_id na mesma página em alguns endpoints
// (confirmado em /seasons/now — ex.: um anime com múltiplos horários de
// exibição pode listar a mesma entrada 2x). Isso é uma garantia que o Jikan
// não dá, então é responsabilidade da camada anticorrupção — dedupe aqui,
// antes de cachear, cobre searchAnime e getByCurrentSeson de uma vez (os dois
// únicos chamadores de mapJikanList), em vez de cada um reimplementar.
function dedupeByMalId(items: JikanAnimeRaw[]): JikanAnimeRaw[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.mal_id)) return false;
    seen.add(item.mal_id);
    return true;
  });
}

function mapJikanAnime(raw: JikanAnimeRaw): AnimeDto {
  return animeDtoSchema.parse({
    malId: raw.mal_id,
    title: raw.title,
    imageUrl:
      raw.images?.jpg?.large_image_url ?? raw.images?.jpg?.image_url ?? null,
    synopsis: raw.synopsis,
    episodes: raw.episodes,
    genres: raw.genres?.map((genre) => genre.name) ?? [],
    malUrl: raw.url,
    type: raw.type,
    year: raw.year ?? raw.aired?.prop?.from?.year ?? null,
    score: raw.score,
    status: raw.status,
  });
}

function mapJikanAnimeFull(raw: JikanAnimeFullRaw): AnimeFullDto {
  return animeFullDtoSchema.parse({
    ...mapJikanAnime(raw),
    titleEnglish: raw.title_english,
    titleJapanese: raw.title_japanese,
    // Alguns registros do Jikan têm url null mas embed_url preenchido (e
    // vice-versa) — pega o que tiver disponível em vez de assumir um dos dois.
    trailerUrl: raw.trailer?.url ?? raw.trailer?.embed_url ?? null,
    trailerImageUrl: raw.trailer?.images?.large_image_url ?? null,
    background: raw.background,
    source: raw.source,
    duration: raw.duration,
    rating: raw.rating,
    aired: raw.aired?.string ?? null,
    season: raw.season ?? null,
    broadcast: raw.broadcast?.string ?? null,
    rank: raw.rank,
    popularity: raw.popularity,
    members: raw.members,
    favorites: raw.favorites,
    studios: raw.studios?.map((studio) => studio.name) ?? [],
    producers: raw.producers?.map((producer) => producer.name) ?? [],
    licensors: raw.licensors?.map((licensor) => licensor.name) ?? [],
    relations:
      raw.relations?.map((group) => ({
        relation: group.relation,
        entries: group.entry.map((entry) => ({
          malId: entry.mal_id,
          type: entry.type,
          name: entry.name,
        })),
      })) ?? [],
  });
}
