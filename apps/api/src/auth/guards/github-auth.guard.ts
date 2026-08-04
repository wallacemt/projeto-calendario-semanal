import {
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Env } from '../../config/env.schema';

// Ver GoogleAuthGuard — mesmo raciocínio para o provider GitHub.
@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clientId = this.config.get('GITHUB_CLIENT_ID', { infer: true });
    const clientSecret = this.config.get('GITHUB_CLIENT_SECRET', {
      infer: true,
    });
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Login com GitHub não está configurado neste ambiente.',
      );
    }
    return super.canActivate(context);
  }
}
