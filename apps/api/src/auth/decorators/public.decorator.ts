import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Opt-out do JwtAuthGuard global (§9 do blueprint) — marca rotas que não
// exigem access token (registro, login, callbacks de OAuth, etc).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
