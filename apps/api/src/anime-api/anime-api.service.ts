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

const ANILIST_URL = 'https://graphql.anilist.co';
// AniList é público e sem key — o limite documentado é 90 req/min, mas desde
// 2023 opera degradado em ~30 req/min "temporariamente" (nunca voltou ao
// valor normal). 2200ms entre chamadas fica dentro da margem mesmo no
// cenário degradado (~27 req/min) — mesma ideia de token bucket simplificado
// do JikanService original. Ajustar pra baixo se a AniList restaurar o
// limite documentado.
const MIN_INTERVAL_MS = 2200;
const SEARCH_CACHE_TTL_SECONDS = 60 * 60; // 1h — ADR-06
const DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — ADR-06
// 5xx/erro de rede costuma ser instabilidade pontual da própria AniList
// (eles têm outages documentados) — vale tentar de novo. Backoff exponencial
// (500ms, 1s, 2s) em vez de retry imediato pra não martelar um serviço que já
// está com problema (ADR-06).
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;
// Sem timeout, uma conexão que trava fica presa indefinidamente no fetch, e
// como as chamadas são serializadas numa fila única (this.queue), essa única
// requisição travada bloqueia todas as outras atrás dela.
const REQUEST_TIMEOUT_MS = 8_000;

// Mensagem genérica de propósito — não amarra o texto de erro ao provider
// atual, já que essa camada é feita pra ser trocável (ADR-06).
const API_UNAVAILABLE_MESSAGE = 'Serviço de animes indisponível no momento';

// Campos compartilhados entre busca/temporada/detalhe simples — GraphQL não
// precisa de fragment nomeado pra isso, interpolar a mesma string de campos
// já resolve sem duplicar a lista 4x.
const MEDIA_CORE_FIELDS = `
  id
  idMal
  title { romaji english }
  coverImage { large }
  description
  episodes
  genres
  format
  seasonYear
  averageScore
  status
`;

const SEARCH_QUERY = `
  query ($search: String, $page: Int, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
    Page(page: $page, perPage: 20) {
      pageInfo { hasNextPage currentPage lastPage }
      media(search: $search, type: ANIME, format: $format, status: $status, sort: $sort) {
        ${MEDIA_CORE_FIELDS}
      }
    }
  }
`;

const SEASON_QUERY = `
  query ($page: Int, $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: 20) {
      pageInfo { hasNextPage currentPage lastPage }
      media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
        ${MEDIA_CORE_FIELDS}
      }
    }
  }
`;

const BY_ID_QUERY = `
  query ($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      ${MEDIA_CORE_FIELDS}
    }
  }
`;

const FULL_BY_ID_QUERY = `
  query ($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      ${MEDIA_CORE_FIELDS}
      title { native }
      bannerImage
      source
      duration
      startDate { year month day }
      endDate { year month day }
      season
      trailer { id site thumbnail }
      rankings { rank type allTime }
      popularity
      favourites
      studios { edges { isMain node { name } } }
      relations {
        edges {
          relationType
          node { idMal type title { romaji } }
        }
      }
    }
  }
`;

type AniListSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

interface AniListPageInfoRaw {
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number | null;
}

interface AniListMediaRaw {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native?: string | null;
  };
  coverImage: { large: string | null };
  description: string | null;
  episodes: number | null;
  genres: string[];
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  status: string | null;
}

interface AniListPageRaw {
  Page: { pageInfo: AniListPageInfoRaw; media: AniListMediaRaw[] };
}

interface AniListDateRaw {
  year: number | null;
  month: number | null;
  day: number | null;
}

interface AniListRankingRaw {
  rank: number;
  type: 'RATED' | 'POPULAR' | string;
  allTime: boolean | null;
}

interface AniListStudioEdgeRaw {
  isMain: boolean;
  node: { name: string };
}

interface AniListRelationEdgeRaw {
  relationType: string;
  node: {
    idMal: number | null;
    type: string;
    title: { romaji: string | null };
  };
}

// Shape do Media com os campos extras só usados na página de detalhe
// (AnimeFullDto) — bem mais pesado que AniListMediaRaw, mesma separação de
// query/cache que já existia pro /anime/{id}/full do Jikan.
interface AniListMediaFullRaw extends AniListMediaRaw {
  bannerImage: string | null;
  source: string | null;
  duration: number | null;
  startDate: AniListDateRaw;
  endDate: AniListDateRaw;
  season: string | null;
  trailer: {
    id: string | null;
    site: string | null;
    thumbnail: string | null;
  } | null;
  rankings: AniListRankingRaw[];
  popularity: number | null;
  favourites: number | null;
  studios: { edges: AniListStudioEdgeRaw[] };
  relations: { edges: AniListRelationEdgeRaw[] };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Anticorrupção (ADR-06): único ponto do backend que fala com o provider
// externo de animes. Faz rate limiting, cache (Redis, degrada para "sem
// cache" se REDIS_URL não estiver configurada) e mapeia a resposta crua para
// o nosso AnimeDto — quem consome este service nunca vê o shape da AniList.
// Nome do service é deliberadamente genérico (não "AniListService"): essa
// mesma anticorrupção existe pra permitir trocar de provider de novo sem
// vazar o nome do vendor pros consumidores (AnimesService, controllers).
@Injectable()
export class AnimeApiService {
  private readonly logger = new Logger(AnimeApiService.name);
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async searchAnime(input: SearchAnimesQuery): Promise<PaginatedAnimeDto> {
    const cacheKey = `animeapi:search:${input.query.toLowerCase()}:${input.page}:${input.type ?? ''}:${input.status ?? ''}:${input.orderBy ?? ''}`;
    const cached = await this.readCache<PaginatedAnimeDto>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchAniList<AniListPageRaw>(SEARCH_QUERY, {
      search: input.query,
      page: input.page,
      format: input.type ? FORMAT_FILTER[input.type] : undefined,
      status: input.status ? STATUS_FILTER[input.status] : undefined,
      sort: input.orderBy === 'score' ? ['SCORE_DESC'] : ['SEARCH_MATCH'],
    });
    const result = mapAniListPage(raw);
    await this.writeCache(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
    return result;
  }

  async getAnimeById(malId: number): Promise<AnimeDto> {
    const cacheKey = `animeapi:anime:${malId}`;
    const cached = await this.readCache<AnimeDto>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchAniList<{ Media: AniListMediaRaw }>(
      BY_ID_QUERY,
      {
        idMal: malId,
      },
    );
    const result = mapAniListMedia(raw.Media);
    await this.writeCache(cacheKey, result, DETAIL_CACHE_TTL_SECONDS);
    return result;
  }

  async getAnimeFullById(malId: number): Promise<AnimeFullDto> {
    const cacheKey = `animeapi:anime:full:${malId}`;
    const cached = await this.readCache<AnimeFullDto>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchAniList<{ Media: AniListMediaFullRaw }>(
      FULL_BY_ID_QUERY,
      { idMal: malId },
    );
    const result = mapAniListMediaFull(raw.Media);
    await this.writeCache(cacheKey, result, DETAIL_CACHE_TTL_SECONDS);
    return result;
  }

  async getByCurrentSeason(page: number): Promise<PaginatedAnimeDto> {
    const cacheKey = `animeapi:seasonNowAnimes:${page}`;
    const cached = await this.readCache<PaginatedAnimeDto>(cacheKey);
    if (cached) return cached;

    const { season, year } = getCurrentSeason();
    const raw = await this.fetchAniList<AniListPageRaw>(SEASON_QUERY, {
      page,
      season,
      seasonYear: year,
    });
    const result = mapAniListPage(raw);
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

  // Retry (429/5xx/rede/erro GraphQL) fica FORA da fila — só o disparo em si
  // (dispatch) entra nela. Ver comentário original do JikanService: isso
  // evita que os até 3 retries de uma chamada travem a fila inteira pras
  // próximas (outro endpoint, outro request de usuário).
  private async fetchAniList<T>(
    query: string,
    variables: Record<string, unknown>,
    attempt = 0,
  ): Promise<T> {
    const { res, retryAfterHeader } = await this.dispatch(query, variables);

    if (res?.status === 429 && attempt < MAX_RETRIES) {
      const retryAfterSeconds = Number(retryAfterHeader) || 1;
      this.logger.warn(`AniList 429 — retry em ${retryAfterSeconds}s`);
      await sleep(retryAfterSeconds * 1000);
      return this.fetchAniList<T>(query, variables, attempt + 1);
    }

    const isTransientFailure = !res || res.status > 500;
    if (isTransientFailure && attempt < MAX_RETRIES) {
      const delayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
      this.logger.warn(
        `AniList ${res?.status ?? 'network error'} — retry em ${delayMs}ms (tentativa ${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(delayMs);
      return this.fetchAniList<T>(query, variables, attempt + 1);
    }

    if (!res || !res.ok)
      throw new ServiceUnavailableException(API_UNAVAILABLE_MESSAGE);

    const body = (await res.json()) as {
      data?: T;
      errors?: { message: string }[];
    };
    if (!body.data || body.errors?.length) {
      this.logger.warn(
        `AniList respondeu com erro GraphQL: ${JSON.stringify(body.errors)}`,
      );
      throw new ServiceUnavailableException(API_UNAVAILABLE_MESSAGE);
    }
    return body.data;
  }

  // Só o disparo passa pela fila — é o único trecho que precisa do intervalo
  // mínimo entre chamadas. Cada entrada na fila é uma tentativa isolada;
  // quem decide se tenta de novo é o fetchAniList, já fora dela.
  private dispatch(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<{ res: Response | null; retryAfterHeader: string | null }> {
    const run = this.queue.then(() => this.singleAttempt(query, variables));
    // isola falhas: uma requisição que falhou não deve travar a fila para as próximas
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async singleAttempt(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<{ res: Response | null; retryAfterHeader: string | null }> {
    const wait = this.lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();

    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }).catch(() => null);

    return { res, retryAfterHeader: res?.headers.get('retry-after') ?? null };
  }
}

const FORMAT_FILTER: Record<string, string> = {
  tv: 'TV',
  movie: 'MOVIE',
  ova: 'OVA',
  special: 'SPECIAL',
  ona: 'ONA',
  music: 'MUSIC',
};

const STATUS_FILTER: Record<string, string> = {
  airing: 'RELEASING',
  complete: 'FINISHED',
  upcoming: 'NOT_YET_RELEASED',
};

const FORMAT_LABEL: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
};

const STATUS_LABEL: Record<string, string> = {
  FINISHED: 'Finished Airing',
  RELEASING: 'Currently Airing',
  NOT_YET_RELEASED: 'Not yet aired',
  CANCELLED: 'Cancelled',
  HIATUS: 'On Hiatus',
};

// Limite de temporada segue a mesma convenção do MAL/Jikan (trimestres fixos
// a partir de janeiro) — a AniList não expõe um "season: NOW", quem decide o
// que é "agora" é o consumidor da API.
function getCurrentSeason(now = new Date()): {
  season: AniListSeason;
  year: number;
} {
  const seasons: AniListSeason[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  return {
    season: seasons[Math.floor(now.getMonth() / 3)],
    year: now.getFullYear(),
  };
}

// A descrição da AniList vem em HTML (é renderizada como rich text no site
// deles) — nunca repassar isso cru pro synopsis: além de poluir a UI com
// tags, é dado de fonte externa, então tratar como não confiável (risco de
// XSS se algum dia virar v-html no front).
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

// A AniList repete o mesmo idMal em páginas diferentes de alguns endpoints,
// igual o mal_id duplicado que já existia no Jikan (mesma responsabilidade
// de anticorrupção). Também filtra fora entradas sem idMal (exclusivas da
// AniList, sem equivalente no MAL) — nosso contrato (AnimeDto.malId) exige
// um malId válido.
function dedupeByMalId(items: AniListMediaRaw[]): AniListMediaRaw[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (item.idMal == null || seen.has(item.idMal)) return false;
    seen.add(item.idMal);
    return true;
  });
}

function mapAniListPage(raw: AniListPageRaw): PaginatedAnimeDto {
  return {
    data: dedupeByMalId(raw.Page.media).map(mapAniListMedia),
    hasNextPage: raw.Page.pageInfo.hasNextPage,
    currentPage: raw.Page.pageInfo.currentPage,
    lastPage: raw.Page.pageInfo.lastPage,
  };
}

function mapAniListMedia(raw: AniListMediaRaw): AnimeDto {
  return animeDtoSchema.parse({
    malId: raw.idMal,
    title: raw.title.romaji ?? raw.title.english ?? '',
    imageUrl: raw.coverImage.large,
    synopsis: raw.description ? stripHtml(raw.description) : null,
    episodes: raw.episodes,
    genres: raw.genres,
    malUrl: raw.idMal ? `https://myanimelist.net/anime/${raw.idMal}` : null,
    type: raw.format ? (FORMAT_LABEL[raw.format] ?? raw.format) : null,
    year: raw.seasonYear,
    score: raw.averageScore == null ? null : raw.averageScore / 10,
    status: raw.status ? (STATUS_LABEL[raw.status] ?? raw.status) : null,
  });
}

function mapAniListMediaFull(raw: AniListMediaFullRaw): AnimeFullDto {
  return animeFullDtoSchema.parse({
    ...mapAniListMedia(raw),
    titleEnglish: raw.title.english,
    titleJapanese: raw.title.native ?? null,
    trailerUrl: mapTrailerUrl(raw.trailer),
    trailerImageUrl: raw.trailer?.thumbnail ?? null,
    bannerImage: raw.bannerImage,
    source: raw.source ? raw.source.replace(/_/g, ' ') : null,
    duration: raw.duration ? `${raw.duration} min per ep` : null,
    // AniList não tem classificação etária estilo MPAA (só `isAdult`,
    // boolean) — sem equivalente real, fica null. Perda de dado aceita
    // conscientemente na migração, não é um bug a corrigir depois.
    rating: null,
    aired: formatAiredRange(raw.startDate, raw.endDate),
    season: raw.season ? raw.season.toLowerCase() : null,
    // AniList não expõe horário fixo semanal (só `nextAiringEpisode`, que é
    // a data pontual do próximo episódio, não um "toda sexta 23h") — sem
    // equivalente direto, fica null.
    broadcast: null,
    rank: findRanking(raw.rankings, 'RATED'),
    popularity: findRanking(raw.rankings, 'POPULAR'),
    members: raw.popularity,
    favorites: raw.favourites,
    studios: raw.studios.edges
      .filter((edge) => edge.isMain)
      .map((edge) => edge.node.name),
    producers: raw.studios.edges
      .filter((edge) => !edge.isMain)
      .map((edge) => edge.node.name),
    // AniList não distingue "licenciadora regional" de estúdios/produtoras
    // — sem equivalente, sempre vazio.
    licensors: [],
    relations: mapRelations(raw.relations.edges),
  });
}

function mapTrailerUrl(trailer: AniListMediaFullRaw['trailer']): string | null {
  if (!trailer?.id) return null;
  if (trailer.site === 'youtube')
    return `https://www.youtube.com/watch?v=${trailer.id}`;
  if (trailer.site === 'dailymotion')
    return `https://www.dailymotion.com/video/${trailer.id}`;
  return null;
}

function findRanking(
  rankings: AniListRankingRaw[],
  type: 'RATED' | 'POPULAR',
): number | null {
  return (
    rankings.find((ranking) => ranking.type === type && ranking.allTime)
      ?.rank ?? null
  );
}

function formatAiredRange(
  start: AniListDateRaw,
  end: AniListDateRaw,
): string | null {
  const from = formatAniListDate(start);
  if (!from) return null;
  const to = formatAniListDate(end);
  return `${from} to ${to ?? '?'}`;
}

function formatAniListDate(date: AniListDateRaw): string | null {
  if (!date.year) return null;
  if (!date.month || !date.day) return String(date.year);
  return new Date(
    Date.UTC(date.year, date.month - 1, date.day),
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// AniList devolve relações "achatadas" (1 edge = 1 relação com 1 anime); o
// Jikan já devolvia agrupado por tipo de relação. Reagrupa aqui pra manter o
// mesmo shape de saída (AnimeFullDto.relations) sem mudar o contrato pro front.
function mapRelations(
  edges: AniListRelationEdgeRaw[],
): AnimeFullDto['relations'] {
  const groups = new Map<
    string,
    { malId: number; type: string; name: string }[]
  >();
  for (const edge of edges) {
    if (edge.node.idMal == null) continue; // sem malId, fora do nosso contrato
    const relation = edge.relationType.replace(/_/g, ' ');
    const entries = groups.get(relation) ?? [];
    entries.push({
      malId: edge.node.idMal,
      type: edge.node.type,
      name: edge.node.title.romaji ?? '',
    });
    groups.set(relation, entries);
  }
  return Array.from(groups, ([relation, entries]) => ({ relation, entries }));
}
