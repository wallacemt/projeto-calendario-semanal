import { AnimesService } from './animes.service';

// Cobre a única regra não-trivial do módulo: degradação graciosa quando o
// Jikan está fora do ar (§12 do blueprint — servir o espelho local em vez de
// derrubar a rota).

function buildAnimesService() {
  const jikan = { getAnimeById: jest.fn(), searchAnime: jest.fn() };
  const prisma = { anime: { upsert: jest.fn(), findUnique: jest.fn() } };
  const animes = new AnimesService(jikan as never, prisma as never);
  return { animes, jikan, prisma };
}

describe('AnimesService', () => {
  it('getByMalId serve do espelho local quando o Jikan está fora do ar', async () => {
    const { animes, jikan, prisma } = buildAnimesService();
    jikan.getAnimeById.mockRejectedValue(new Error('Jikan indisponível'));
    prisma.anime.findUnique.mockResolvedValue({
      malId: 52991,
      title: 'Frieren',
      imageUrl: null,
      synopsis: null,
      episodes: 28,
      genres: ['Fantasia'],
      malUrl: null,
      cachedAt: new Date(),
    });

    const result = await animes.getByMalId(52991);

    expect(result.title).toBe('Frieren');
    expect(prisma.anime.upsert).not.toHaveBeenCalled();
  });

  it('getByMalId propaga o erro quando não há nada em cache local para servir', async () => {
    const { animes, jikan, prisma } = buildAnimesService();
    jikan.getAnimeById.mockRejectedValue(new Error('Jikan indisponível'));
    prisma.anime.findUnique.mockResolvedValue(null);

    await expect(animes.getByMalId(999)).rejects.toThrow('Jikan indisponível');
  });
});
