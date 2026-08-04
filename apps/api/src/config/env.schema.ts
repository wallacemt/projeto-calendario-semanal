import { z } from 'zod';

// Vars consumidos a partir do M0.2. JWT_* e FRONTEND_URL viram obrigatórios no
// M1 (auth depende deles para existir). OAuth/Supabase/Resend continuam
// opcionais: a ausência degrada a feature específica (ex.: rota OAuth de um
// provedor não configurado responde 503) em vez de derrubar o boot inteiro —
// ver .env.example.
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url(),

  REDIS_URL: z.url().optional(),
  JWT_SECRET: z.string().min(1),
  // Secret dedicado aos JWTs auxiliares (verify-email, password-reset,
  // oauth-state) — LSF-2026-002. Nunca o mesmo valor de JWT_SECRET: assim um
  // token de reset/verify vazado ou de vida mais longa (1h/24h) não pode ser
  // reaproveitado como access token (cross-use), mesmo que a claim `purpose`
  // também seja adulterada.
  JWT_AUX_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.email().default('no-reply@aniweek.app'),
});

export type Env = z.infer<typeof envSchema>;
