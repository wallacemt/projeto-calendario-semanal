import { createHash, randomBytes } from 'node:crypto';

// 256 bits de entropia — alto o bastante para dispensar bcrypt no cookie de
// refresh (ao contrário de senhas, que são de baixa entropia e por isso
// precisam de custo computacional no hash).
const REFRESH_TOKEN_BYTES = 32;

export interface GeneratedRefreshToken {
  /** Valor cru enviado ao cliente via cookie httpOnly — nunca persistido. */
  token: string;
  /** Hash armazenado em RefreshToken.tokenHash. */
  tokenHash: string;
}

export function generateRefreshToken(): GeneratedRefreshToken {
  const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  return { token, tokenHash: hashRefreshToken(token) };
}

// SHA-256 simples (não bcrypt): o token já tem entropia alta, então o que
// precisamos é um hash rápido e determinístico que permita lookup por
// igualdade direta na tabela RefreshToken.
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
