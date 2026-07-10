import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@aniweek/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Env } from '../config/env.schema';
import { AuthProvider } from '../../generated/prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { AuthenticatedUser } from './types/jwt-payload.type';
import type { NormalizedOAuthProfile } from './types/oauth-profile.type';

const REFRESH_COOKIE_NAME = 'refreshToken';
// Cookie só é enviado para rotas de auth — não polui todas as requests da API.
const REFRESH_COOKIE_PATH = '/auth';

// Throttle mais restrito nas rotas sensíveis a brute-force (RNF-04/§10). O
// limite "global" (menos restrito) é o default do ThrottlerModule em AppModule.
const BRUTE_FORCE_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle(BRUTE_FORCE_THROTTLE)
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.auth.register(body);
    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    return { user, accessToken };
  }

  @Public()
  @Throttle(BRUTE_FORCE_THROTTLE)
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.auth.login(body);
    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    return { user, accessToken };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.auth.refresh(
        req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined,
      );
    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(
      req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined,
    );
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }

  // Não faz parte do contrato §8 do blueprint, mas é necessário para o front
  // hidratar o usuário em memória após um refresh silencioso (que só devolve
  // {accessToken}) sem precisar do módulo users (M2, fora de escopo aqui).
  // Não bate no banco: os dados já vêm do payload do access token validado.
  @Get('me')
  currentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async verifyEmail(@Body() body: VerifyEmailInput) {
    await this.auth.verifyEmail(body.token);
  }

  @Public()
  @Throttle(BRUTE_FORCE_THROTTLE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() body: ForgotPasswordInput) {
    await this.auth.forgotPassword(body.email);
  }

  @Public()
  @Throttle(BRUTE_FORCE_THROTTLE)
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() body: ResetPasswordInput) {
    await this.auth.resetPassword(body.token, body.password);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('oauth/google')
  googleAuth() {
    // Corpo vazio de propósito: o GoogleAuthGuard já redireciona para o
    // Google antes do handler ser chamado.
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('oauth/google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    await this.handleOAuthCallback(AuthProvider.GOOGLE, req, res);
  }

  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('oauth/github')
  githubAuth() {
    // Ver googleAuth().
  }

  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('oauth/github/callback')
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    await this.handleOAuthCallback(AuthProvider.GITHUB, req, res);
  }

  private async handleOAuthCallback(
    provider: AuthProvider,
    req: Request,
    res: Response,
  ): Promise<void> {
    const profile = req.user as NormalizedOAuthProfile;
    const { refreshToken, refreshTokenExpiresAt } =
      await this.auth.loginWithOAuth(provider, profile);
    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    // Sem accessToken na URL (evita exposição via histórico/logs/referrer): o
    // front chama POST /auth/refresh — o cookie já foi setado acima — assim
    // que a página de callback carrega, para obter o accessToken em memória.
    const frontendUrl = this.config.get('FRONTEND_URL', { infer: true });
    res.redirect(`${frontendUrl}/oauth-callback`);
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
  ): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      expires: expiresAt,
    });
  }
}
