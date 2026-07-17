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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
