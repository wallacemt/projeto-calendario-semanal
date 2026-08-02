import { Injectable, type MessageEvent } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import type { NotificationResponse } from './types/social.type';

// Broadcast em memória do feed de notificações (M10 — SSE). Um Subject por
// usuário conectado; stream() cria sob demanda e remove do Map quando o
// último assinante desconecta (finalize + subject.observed), pra não vazar
// um Subject por usuário que já fechou a aba.
//
// ponytail: em memória de uma única instância do processo Nest — funciona
// porque o deploy (ADR-10) é 1 container `api` só no Portainer, sem
// horizontal scaling. Se um dia existir mais de uma réplica, uma notificação
// só chegaria via SSE a quem estiver conectado NA MESMA réplica que criou o
// evento; a leitura via GET /social/notifications continuaria correta (vem
// do Postgres), só o "tempo real" que ficaria por instância. Upgrade nesse
// cenário: publicar no Redis (já existe RedisModule no projeto) com
// pub/sub e cada réplica relay pro seu próprio Map de Subjects.
@Injectable()
export class NotificationEventsService {
  private readonly subjects = new Map<string, Subject<MessageEvent>>();

  stream(userId: string): Observable<MessageEvent> {
    let subject = this.subjects.get(userId);
    if (!subject) {
      subject = new Subject<MessageEvent>();
      this.subjects.set(userId, subject);
    }
    return subject.asObservable().pipe(
      finalize(() => {
        if (!subject.observed) this.subjects.delete(userId);
      }),
    );
  }

  emit(userId: string, notification: NotificationResponse): void {
    this.subjects.get(userId)?.next({ data: notification });
  }
}
