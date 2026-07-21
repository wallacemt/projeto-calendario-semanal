import { AnimeApiService } from './anime-api.service';

// Cobre as regras não-triviais do módulo: o mapeamento anticorrupção
// (AniList cru -> AnimeDto, ADR-06), o cache hit não chamar a AniList de
// novo, e os dois pontos de mapeamento que quebram silenciosamente se
// mexidos sem cuidado (score null vira 0 por coerção, description em HTML
// vaza pro synopsis). O rate limiter (fila + intervalo mínimo) e os retries
// (429/5xx/rede) não são cobertos aqui — dependem de tempo real e o ganho de
// testá-los não paga o custo de mockar timers para uma feature de M3.

function buildAnimeApiService(
  redis: { get: jest.Mock; set: jest.Mock } | null = null,
) {
  return new AnimeApiService(redis as never);
}

function fakeGraphQLResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve({ data }),
  } as unknown as Response;
}

function fakeMedia(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    idMal: 52991,
    title: { romaji: "Frieren: Beyond Journey's End", english: null },
    coverImage: { large: 'https://img/frieren.jpg' },
    description: 'Uma maga élfica...',
    episodes: 28,
    genres: ['Fantasia', 'Aventura'],
    format: 'TV',
    seasonYear: 2023,
    averageScore: 89,
    status: 'FINISHED',
    ...overrides,
  };
}

describe('AnimeApiService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('searchAnime mapeia a resposta crua da AniList para AnimeDto', async () => {
    const service = buildAnimeApiService();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      fakeGraphQLResponse({
        Page: {
          pageInfo: { hasNextPage: true, currentPage: 1, lastPage: 3 },
          media: [fakeMedia()],
        },
      }),
    );

    const result = await service.searchAnime({ query: 'frieren', page: 1 });

    expect(result).toEqual({
      hasNextPage: true,
      currentPage: 1,
      lastPage: 3,
      data: [
        {
          malId: 52991,
          title: "Frieren: Beyond Journey's End",
          imageUrl: 'https://img/frieren.jpg',
          synopsis: 'Uma maga élfica...',
          episodes: 28,
          genres: ['Fantasia', 'Aventura'],
          malUrl: 'https://myanimelist.net/anime/52991',
          type: 'TV',
          year: 2023,
          score: 8.9,
          status: 'Finished Airing',
        },
      ],
    });
  });

  it('em cache hit, não chama a AniList de novo', async () => {
    const cached = JSON.stringify({
      hasNextPage: false,
      currentPage: 1,
      lastPage: 1,
      data: [
        {
          malId: 1,
          title: 'X',
          imageUrl: null,
          synopsis: null,
          episodes: null,
          genres: [],
          malUrl: null,
          type: null,
          year: null,
          score: null,
          status: null,
        },
      ],
    });
    const redis = { get: jest.fn().mockResolvedValue(cached), set: jest.fn() };
    const service = buildAnimeApiService(redis);
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await service.searchAnime({ query: 'x', page: 1 });

    expect(result.data[0].malId).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('score fica null (não 0) quando a AniList ainda não tem averageScore', async () => {
    const service = buildAnimeApiService();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        fakeGraphQLResponse({ Media: fakeMedia({ averageScore: null }) }),
      );

    const result = await service.getAnimeById(52991);

    expect(result.score).toBeNull();
  });

  it('remove tags e entidades HTML da description antes de virar synopsis', async () => {
    const service = buildAnimeApiService();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      fakeGraphQLResponse({
        Media: fakeMedia({
          description:
            '<i>Uma maga élfica</i><br>vive há séculos &mdash; e sobrevive.',
        }),
      }),
    );

    const result = await service.getAnimeById(52991);

    expect(result.synopsis).toBe(
      'Uma maga élfica\nvive há séculos — e sobrevive.',
    );
  });
});
