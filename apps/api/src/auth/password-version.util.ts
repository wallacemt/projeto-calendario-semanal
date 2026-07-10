import { createHash } from 'node:crypto';

// Deriva uma "versão" da senha atual para embutir no token de reset. Assim
// que o reset é concluído a passwordHash muda, e qualquer replay do mesmo
// token (ainda dentro da validade de 1h) deixa de bater com a versão vigente.
// Isso dá reset de senha de uso único sem precisar de uma tabela extra de
// tokens revogados (YAGNI para o MVP — RNF-01).
export function computePasswordVersion(passwordHash: string | null): string {
  return createHash('sha256')
    .update(passwordHash ?? '')
    .digest('hex');
}
