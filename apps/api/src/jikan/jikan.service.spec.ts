import { JikanService } from './jikan.service';

// Cobre as duas regras não-triviais do módulo: o mapeamento anticorrupção
// (Jikan cru -> AnimeDto, ADR-06) e o cache hit não chamar o Jikan de novo.
// O rate limiter (fila + intervalo mínimo) e os retries (429 e 5xx/erro de
// rede) não são cobertos aqui — dependem de tempo real e o ganho de testá-los
// não paga o custo de mockar timers para uma feature de M3.

function buildJikanService(
  redis: { get: jest.Mock; set: jest.Mock } | null = null,
) {
  return new JikanService(redis as never);
}

function fakeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function fakeListBody(
  data: unknown[],
  hasNextPage = false,
  currentPage = 1,
  lastPage: number | null = null,
) {
  return {
    data,
    pagination: {
      has_next_page: hasNextPage,
      current_page: currentPage,
      last_visible_page: lastPage,
    },
  };
}

describe('JikanService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('searchAnime mapeia a resposta crua do Jikan para AnimeDto', async () => {
    const jikan = buildJikanService();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      fakeResponse(
        fakeListBody(
          [
            {
              mal_id: 52991,
              title: "Frieren: Beyond Journey's End",
              images: { jpg: { large_image_url: 'https://img/frieren.jpg' } },
              synopsis: 'Uma maga élfica...',
              episodes: 28,
              genres: [{ name: 'Fantasia' }, { name: 'Aventura' }],
              url: 'https://myanimelist.net/anime/52991',
              type: 'TV',
              year: 2023,
              score: 8.9,
              status: 'Finished Airing',
            },
          ],
          true,
          1,
          3,
        ),
      ),
    );

    const result = await jikan.searchAnime({ query: 'frieren', page: 1 });

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

  it('em cache hit, não chama o Jikan de novo', async () => {
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
    const jikan = buildJikanService(redis);
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await jikan.searchAnime({ query: 'x', page: 1 });

    expect(result.data[0].malId).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
