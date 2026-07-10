import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { Env } from '../../config/env.schema';

// ADR-05: o envio de email é best-effort — nunca pode derrubar registro ou
// reset de senha. Sem RESEND_API_KEY configurada (dev/local), só loga.
// TODO(M2+): trocar o corpo em texto puro por template HTML quando o domínio
// de envio estiver verificado no Resend.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(config: ConfigService<Env, true>) {
    const apiKey = config.get('RESEND_API_KEY', { infer: true });
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = config.get('RESEND_FROM_EMAIL', { infer: true });
    this.frontendUrl = config.get('FRONTEND_URL', { infer: true });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.frontendUrl}/verify-email?token=${token}`;
    await this.send(
      to,
      'Confirme seu email — AnimeWeek',
      `Clique para confirmar sua conta: ${link}`,
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.frontendUrl}/reset-password?token=${token}`;
    await this.send(
      to,
      'Redefinição de senha — AnimeWeek',
      `Clique para redefinir sua senha: ${link}`,
    );
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[stub] email para ${to} — "${subject}": ${text}`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        text,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar email para ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
