// DTO anticorrupção (mesmo espírito do ADR-06, aplicado ao OAuth): as
// strategies do Passport traduzem o Profile específico de cada provider para
// este formato antes de chegar no AuthService, que não conhece Google/GitHub.
export interface NormalizedOAuthProfile {
  providerAccountId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  // LSF-2026-001: só é `true` quando o provider comprova a posse do email
  // (Google: `email_verified`; GitHub: `primary && verified` via /user/emails).
  // Hoje as duas strategies só deixam chegar aqui email já verificado — este
  // campo existe para o AuthService também checar antes de vincular a uma
  // conta local existente (defesa em profundidade: não depender só da
  // strategy para uma decisão de segurança tomada no service).
  emailVerifiedByProvider: boolean;
}
