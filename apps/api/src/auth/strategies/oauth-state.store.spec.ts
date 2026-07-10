import { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { OAuthStateStore } from './oauth-state.store';
import type { Env } from '../../config/env.schema';

// LSF-2026-003: o "state" sozinho (um JWT válido) não prova que foi este
// browser quem iniciou o fluxo OAuth — por isso o nonce embutido no state
// precisa bater com o nonce gravado no cookie httpOnly por store(). Estes
// testes simulam req/res com jest.fn() para exercitar store()+verify() sem
// precisar de um servidor Express de verdade.

function buildStore() {
  const jwt = new JwtService({ secret: 'test-aux-secret' });
  const config = {
    get: (key: keyof Env) => (key === 'NODE_ENV' ? 'test' : undefined),
  } as ConfigService<Env, true>;
  const store = new OAuthStateStore(jwt, config);

  const cookies: Record<string, string> = {};
  const res = {
    cookie: jest.fn((name: string, value: string) => {
      cookies[name] = value;
    }),
    clearCookie: jest.fn((name: string) => {
      delete cookies[name];
    }),
  };
  const req = { res, cookies } as unknown as Request;

  return { store, req, res };
}

describe('OAuthStateStore', () => {
  it('aceita quando o nonce do state bate com o nonce do cookie', (done) => {
    const { store, req } = buildStore();

    store.store(req, (err, state) => {
      expect(err).toBeNull();
      store.verify(req, state as string, (verifyErr, ok) => {
        expect(verifyErr).toBeNull();
        expect(ok).toBe(true);
        done();
      });
    });
  });

  it('rejeita quando o cookie do nonce está ausente (ex.: replay sem o cookie original)', (done) => {
    const { store, req } = buildStore();

    store.store(req, (err, state) => {
      expect(err).toBeNull();
      delete (req.cookies as Record<string, string>).oauth_nonce;
      store.verify(req, state as string, (verifyErr, ok, info) => {
        expect(verifyErr).toBeNull();
        expect(ok).toBe(false);
        expect(info).toBeTruthy();
        done();
      });
    });
  });

  it('rejeita quando o nonce do cookie não bate com o do state (login-CSRF)', (done) => {
    const { store, req } = buildStore();

    store.store(req, (err, state) => {
      expect(err).toBeNull();
      (req.cookies as Record<string, string>).oauth_nonce =
        'nonce-de-outro-fluxo';
      store.verify(req, state as string, (verifyErr, ok) => {
        expect(verifyErr).toBeNull();
        expect(ok).toBe(false);
        done();
      });
    });
  });

  it('limpa o cookie do nonce após verify() (uso único)', (done) => {
    const { store, req, res } = buildStore();

    store.store(req, (err, state) => {
      expect(err).toBeNull();
      store.verify(req, state as string, () => {
        expect(res.clearCookie).toHaveBeenCalledWith(
          'oauth_nonce',
          expect.objectContaining({ path: '/auth/oauth' }),
        );
        done();
      });
    });
  });
});
