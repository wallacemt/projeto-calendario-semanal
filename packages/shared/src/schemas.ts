import { z } from "zod";
import { Season, Weekday, EntryStatus } from "./enums.js";

export const seasonSchema = z.enum(Season);
export const weekdaySchema = z.enum(Weekday);
export const entryStatusSchema = z.enum(EntryStatus);

// Auth (M1 — ADR-04/05/11). Reutilizado no ZodValidationPipe do Nest e nos
// formulários do front (mesmo schema valida os dois lados).
const emailSchema = z.email();
const passwordSchema = z.string().min(8, "A senha deve ter no mínimo 8 caracteres");
const usernameSchema = z
  .string()
  .min(3, "O usuário deve ter no mínimo 3 caracteres")
  .max(20, "O usuário deve ter no máximo 20 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "O usuário só pode conter letras, números e _");

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha obrigatória"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// Perfil (M2 — RF-02). Mesmo schema valida o PATCH no Nest e o form de
// edição no front; username reaproveita usernameSchema (regra de unicidade
// fica por conta do banco/service, Zod só valida formato).
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string().max(280, "A bio deve ter no máximo 280 caracteres").optional(),
  // M10/LGPD: opt-out de exibir as estatísticas (RF-10) no perfil público
  // (GET /social/users/:username) — ver comentário no model User.
  statsPublic: z.boolean().optional(),
});

// M10.3 — vocabulário fechado de gênero da AniList (genre_in só aceita esses
// valores; mandar qualquer outra string faz a query GraphQL não dar erro,
// mas também não filtrar nada). Fixo aqui em vez de buscar da API porque a
// AniList não expõe um endpoint "list genres" barato — é a mesma lista que
// aparece no filtro deles.
export const ANIME_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
] as const;

// Descoberta de animes via Jikan (M3 — RF-03 / ADR-06). animeDtoSchema é a
// camada anticorrupção: nunca confiamos cegamente no shape de uma API externa,
// então a resposta mapeada é validada antes de sair do backend — e o mesmo
// schema tipa o resultado no front, sem duplicar a interface dos dois lados.
export const animeDtoSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string(),
  imageUrl: z.string().nullable(),
  synopsis: z.string().nullable(),
  episodes: z.number().int().nullable(),
  genres: z.array(z.string()),
  malUrl: z.string().nullable(),
  type: z.string().nullable(),
  year: z.number().int().nullable(),
  score: z.number().nullable(),
  status: z.string().nullable(),
});

// query params chegam como string na URL — z.coerce.number() converte "2" -> 2
// antes de validar (o mesmo motivo existe em qualquer Nest/Express: req.query
// nunca é tipado, é sempre Record<string, string>).
export const searchAnimesQuerySchema = z.object({
  query: z.string().min(1, "Informe um termo de busca"),
  page: z.coerce.number().int().min(1).default(1),
  type: z.enum(["tv", "movie", "ova", "special", "ona", "music"]).optional(),
  status: z.enum(["airing", "complete", "upcoming"]).optional(),
  orderBy: z.enum(["score"]).optional(),
  genre: z.enum(ANIME_GENRES).optional(),
});

// "Temporada vigente" (M3) — mesmos filtros type/status/orderBy da busca,
// só sem `query` (não é uma busca por termo). Sem isso os chips de filtro da
// tela Descobrir não tinham efeito nenhum enquanto o usuário não digitasse
// algo: setFilter só reexecutava a busca por texto, e o modo "temporada
// vigente" (tela ao abrir, sem termo) ignorava o filtro selecionado.
export const seasonNowQuerySchema = searchAnimesQuerySchema.omit({ query: true });

// Paginação (M3): tanto a busca quanto "temporada atual" são paginadas pelo
// Jikan (pagination.has_next_page). hasNextPage é o que decide se mostra
// "carregar mais"; lastPage é só informativo pra UI ("página X de Y") —
// opcional porque o Jikan às vezes omite last_visible_page.
export const paginatedAnimeDtoSchema = z.object({
  data: z.array(animeDtoSchema),
  hasNextPage: z.boolean(),
  currentPage: z.number().int().positive(),
  lastPage: z.number().int().positive().nullable(),
});

// M10.3 — "populares na comunidade": agregação sobre CalendarEntry (dados
// internos), não vem da AniList. entryCount é quantos calendários (de
// qualquer usuário) têm esse anime adicionado — a métrica de "popular" aqui.
export const communityPopularItemSchema = animeDtoSchema.extend({
  entryCount: z.number().int().nonnegative(),
});

export const communityPopularQuerySchema = z.object({
  genre: z.enum(ANIME_GENRES).optional(),
});

// Detalhe completo (M3): só usado na página de detalhe do anime — o Jikan
// tem um endpoint /anime/{id}/full dedicado a isso, bem mais pesado que o
// /anime/{id} usado no card/painel lateral. Não é persistido no espelho
// local (Anime): é dado só de leitura pra essa página, não faz parte do
// contrato do calendário.
export const animeFullDtoSchema = animeDtoSchema.extend({
  titleEnglish: z.string().nullable(),
  titleJapanese: z.string().nullable(),
  trailerUrl: z.string().nullable(),
  trailerImageUrl: z.string().nullable(),
  // Herança do Jikan: esse campo já se chamou "background" (a bio/trivia em
  // texto livre que o MAL tem). A AniList não tem equivalente textual —
  // o adapter (anime-api.service.ts) manda o `bannerImage` dela aqui, então
  // o nome foi corrigido pra refletir o que o campo realmente é agora.
  bannerImage: z.string().nullable(),
  source: z.string().nullable(),
  duration: z.string().nullable(),
  rating: z.string().nullable(),
  aired: z.string().nullable(),
  // "Temporada" (tasks.md item 3 / mockup 3c): vem de graça no mesmo
  // /anime/{id}/full (campo `season`, ex.: "fall") — combinado com o `year`
  // já existente em animeDtoSchema pra virar "Fall 2023" na UI.
  season: z.string().nullable(),
  broadcast: z.string().nullable(),
  rank: z.number().int().nullable(),
  popularity: z.number().int().nullable(),
  members: z.number().int().nullable(),
  favorites: z.number().int().nullable(),
  studios: z.array(z.string()),
  producers: z.array(z.string()),
  licensors: z.array(z.string()),
  // "Relações com outros animes" (tasks.md item 3): vem de graça no mesmo
  // /anime/{id}/full do Jikan (campo `relations`) — sem chamada extra, então
  // cabe aqui sem inchar o padrão de cache/rate-limit do JikanService.
  // Galeria (/anime/{id}/pictures) fica de fora: é outro endpoint Jikan (nova
  // chamada, novo cache, nova decisão de degradação em falha parcial) — não é
  // uma extensão de 1 linha, registrado como Deviation.
  relations: z.array(
    z.object({
      relation: z.string(),
      entries: z.array(
        z.object({
          malId: z.number().int().positive(),
          type: z.string(),
          name: z.string(),
        }),
      ),
    }),
  ),
});

// Calendário semanal (M4 — RF-04/ADR-03). Mesmo schema valida o POST no Nest
// e o formulário de "nova estação" no front.
export const createCalendarSchema = z.object({
  season: seasonSchema,
  year: z.coerce.number().int().min(2000).max(2100),
});

// Adicionar entrada ao board (RF-05). weekday aceita BACKLOG (aba extra do
// legado — ADR-08); o backend faz upsert do Anime via Jikan a partir do malId.
export const addEntrySchema = z.object({
  malId: z.number().int().positive(),
  weekday: weekdaySchema,
});

// Drag-and-drop (M5 — RF-05/AC-05). position é o índice final na coluna de
// destino (0-based) — o service recalcula os vizinhos a partir dele.
export const moveEntrySchema = z.object({
  weekday: weekdaySchema,
  position: z.number().int().min(0),
});

// Progresso de episódio (M5 — AC-06). currentEpisode <= totalEpisodes é
// validado no service (aqui só a forma: inteiro >= 0).
export const updateProgressSchema = z.object({
  currentEpisode: z.number().int().min(0),
});

// Import-previous (M6 — ADR-03/§7/AC-04). entryIds opcional restringe quais
// entradas da temporada anterior trazer; sem ele, traz todas as
// status != COMPLETED. resetProgress decide se currentEpisode é preservado
// (default) ou zerado.
export const importPreviousSchema = z.object({
  entryIds: z.array(z.string()).optional(),
  resetProgress: z.boolean().optional(),
});

// Edição manual do espelho local do anime (M6, fora do blueprint). Todos os
// campos opcionais — o PATCH só atualiza o que vier no body. malId não entra
// aqui: é a identidade externa (Jikan), não é editável.
export const updateAnimeSchema = z.object({
  title: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  episodes: z.number().int().positive().nullable().optional(),
  genres: z.array(z.string()).optional(),
  malUrl: z.string().nullable().optional(),
  linkAccess: z.string().nullable().optional(),
});

// Edição manual de uma entrada do board (M6, fora do blueprint) — usado pelo
// modal de editar card (weekday sem drag, progresso, status forçado). Ao
// menos 1 campo precisa vir preenchido (refine), senão é um PATCH vazio.
export const updateEntrySchema = z
  .object({
    weekday: weekdaySchema.optional(),
    currentEpisode: z.number().int().min(0).optional(),
    totalEpisodes: z.number().int().positive().nullable().optional(),
    status: entryStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

// Temas (M7 — RF-08/ADR-09). accent/accent2 são os únicos campos que o
// editor (design M7) deixa o usuário mexer — ver comentário no Theme model
// do schema.prisma sobre por que não é um blob de cores maior.
const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida — use o formato #RRGGBB');

export const createThemeSchema = z.object({
  name: z.string().min(1, 'Dê um nome ao tema').max(40),
  accent: hexColorSchema,
  accent2: hexColorSchema,
  season: seasonSchema.optional(),
});

// Mesmo refine de updateEntrySchema: PATCH vazio não faz sentido.
export const updateThemeSchema = createThemeSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'Informe ao menos um campo para atualizar',
});

// themeId null = volta pro modo "auto" (ThemesService.getActive resolve pela
// estação atual em vez de um tema fixo).
export const activateThemeSchema = z.object({
  themeId: z.string().min(1).nullable(),
});

// Museu (M8 — RF-09). rating/comment opcionais: o mockup pede nota+comentário
// na hora de marcar como assistido, mas nenhum dos dois bloqueia o registro
// (ex.: "assisti há anos, não lembro nota" ainda é um dado válido pro museu).
// watchedSeason/watchedYear (M8.1) são um "quando" narrativo à parte de
// completedAt — ver comentário no model WatchedAnime.
const watchedYearSchema = z.coerce.number().int().min(1900).max(2100);
export const markWatchedSchema = z.object({
  rating: z.number().int().min(1).max(10).optional(),
  comment: z.string().max(500).optional(),
  watchedSeason: seasonSchema.optional(),
  watchedYear: watchedYearSchema.optional(),
});

// Entrada direta no museu (sem passar pelo calendário) — reaproveita o
// mesmo malId+upsert do addEntrySchema (RF-05) em vez de aceitar um título
// livre: WatchedAnime.animeId sempre aponta pro espelho local (Anime), então
// a origem do dado tem que ser a mesma busca Jikan usada em todo o resto do
// app, não um campo de texto solto.
export const createWatchedAnimeSchema = markWatchedSchema.extend({
  malId: z.number().int().positive(),
  completedAt: z.coerce.date().optional(),
});

// Edição de um registro do museu (M8.1 — right-click "Editar"). Todos os
// campos opcionais (só atualiza o que vier) e season/year aceitam `null`
// explícito pra permitir limpar um valor já setado — undefined = "não mexe
// nesse campo", null = "apaga esse campo". Mesmo refine de updateEntrySchema.
export const updateWatchedAnimeSchema = z
  .object({
    rating: z.number().int().min(1).max(10).nullable().optional(),
    comment: z.string().max(500).nullable().optional(),
    completedAt: z.coerce.date().optional(),
    watchedSeason: seasonSchema.nullable().optional(),
    watchedYear: watchedYearSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

// watchedAnimeId null = volta pro modo "auto" (MuseumService.resolveFeaturedId
// cai pro assistido mais recente) — mesmo padrão de activateThemeSchema.
export const setFeaturedWatchedSchema = z.object({
  watchedAnimeId: z.string().min(1).nullable(),
});

// Compartilhamento (M9 — RF-11). Convite nominal por @usuário — reaproveita
// o mesmo usernameSchema do registro/perfil (mesma regra de formato,
// unicidade fica por conta do banco/service).
export const inviteToShareSchema = z.object({
  username: usernameSchema,
});

// Comentário num card do board de outro usuário (M10 — RF-11). Corpo curto
// de propósito (mesmo teto do bio/comment do museu) — não é um fórum.
export const createCommentSchema = z.object({
  body: z.string().min(1, "O comentário não pode ser vazio").max(500, "O comentário deve ter no máximo 500 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AnimeDto = z.infer<typeof animeDtoSchema>;
export type SearchAnimesQuery = z.infer<typeof searchAnimesQuerySchema>;
export type SeasonNowQuery = z.infer<typeof seasonNowQuerySchema>;
export type PaginatedAnimeDto = z.infer<typeof paginatedAnimeDtoSchema>;
export type CommunityPopularItem = z.infer<typeof communityPopularItemSchema>;
export type CommunityPopularQuery = z.infer<typeof communityPopularQuerySchema>;
export type AnimeFullDto = z.infer<typeof animeFullDtoSchema>;
export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;
export type AddEntryInput = z.infer<typeof addEntrySchema>;
export type MoveEntryInput = z.infer<typeof moveEntrySchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type ImportPreviousInput = z.infer<typeof importPreviousSchema>;
export type UpdateAnimeInput = z.infer<typeof updateAnimeSchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type ActivateThemeInput = z.infer<typeof activateThemeSchema>;
export type MarkWatchedInput = z.infer<typeof markWatchedSchema>;
export type CreateWatchedAnimeInput = z.infer<typeof createWatchedAnimeSchema>;
export type UpdateWatchedAnimeInput = z.infer<typeof updateWatchedAnimeSchema>;
export type SetFeaturedWatchedInput = z.infer<typeof setFeaturedWatchedSchema>;
export type InviteToShareInput = z.infer<typeof inviteToShareSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
