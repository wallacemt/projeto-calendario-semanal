import {
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Env } from '../../config/env.schema';

// A strategy é registrada mesmo sem credenciais (ver GoogleStrategy) para não
// derrubar o boot da aplicação — este guard é quem recusa a request de forma
// clara (503) quando o provider não está configurado, em vez de deixar o
// Passport redirecionar para o Google com um client_id inválido.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', {
      infer: true,
    });
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Login com Google não está configurado neste ambiente.',
      );
    }
    return super.canActivate(context);
  }
}
