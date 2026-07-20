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
});

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
});

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
  background: z.string().nullable(),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AnimeDto = z.infer<typeof animeDtoSchema>;
export type SearchAnimesQuery = z.infer<typeof searchAnimesQuerySchema>;
export type PaginatedAnimeDto = z.infer<typeof paginatedAnimeDtoSchema>;
export type AnimeFullDto = z.infer<typeof animeFullDtoSchema>;
