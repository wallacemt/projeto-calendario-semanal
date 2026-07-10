import * as bcrypt from 'bcryptjs';

// ADR-01/§10 do blueprint: bcryptjs no lugar do bcrypt nativo (evita atrito
// de binário no monorepo Bun) com salt 12.
const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(
  plainPassword: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
