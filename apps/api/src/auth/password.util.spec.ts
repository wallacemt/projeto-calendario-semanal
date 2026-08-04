import { hashPassword, verifyPassword } from './password.util';

describe('password.util', () => {
  it('gera um hash diferente da senha em texto puro', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash).not.toBe('correct-horse-battery-staple');
    expect(hash).toMatch(/^\$2[aby]\$12\$/); // bcrypt salt 12 — ADR-01/§10
  });

  it('valida a senha correta contra o hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    await expect(
      verifyPassword('correct-horse-battery-staple', hash),
    ).resolves.toBe(true);
  });

  it('rejeita uma senha incorreta', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword('same-password'),
      hashPassword('same-password'),
    ]);
    expect(hashA).not.toBe(hashB);
  });
});
