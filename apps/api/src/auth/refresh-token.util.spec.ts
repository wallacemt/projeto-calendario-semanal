import { generateRefreshToken, hashRefreshToken } from './refresh-token.util';

describe('refresh-token.util', () => {
  it('gera um token cru diferente do hash armazenável', () => {
    const { token, tokenHash } = generateRefreshToken();
    expect(token).not.toBe(tokenHash);
    expect(token).toHaveLength(64); // 32 bytes em hex
  });

  it('gera tokens únicos a cada chamada', () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it('hashRefreshToken é determinístico (permite lookup por igualdade)', () => {
    const { token, tokenHash } = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(tokenHash);
  });
});
