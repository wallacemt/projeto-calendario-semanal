// Claims do access token (curto, 15min por padrão — ADR-04). Nunca inclui
// dados sensíveis: ele viaja em memória no front, não em cookie httpOnly.
//
// `purpose` existe só para o JwtStrategy recusar cross-use (LSF-2026-002):
// sem essa claim, qualquer JWT assinado com o mesmo secret — inclusive um
// token de verify-email (1d) ou password-reset (1h) — seria aceito como
// Bearer token em qualquer rota protegida, já que o passport-jwt por padrão
// só confere assinatura e expiração, não "para que este token serve".
export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  purpose: 'access';
}

// Forma normalizada do usuário autenticado, usada pelo JwtStrategy e exposta
// via req.user nas rotas protegidas pelo JwtAuthGuard.
export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}
