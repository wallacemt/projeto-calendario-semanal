// Porta de storage (ADR-06/07) — trocável por design, igual Jikan/Email.
// Único ponto que sabe que existe um provedor de storage por trás; consumidores
// (UsersModule hoje, ThemesModule no M7) dependem só desta abstração.
export abstract class StorageService {
  abstract upload(
    bucket: string,
    path: string,
    data: Buffer,
    contentType: string,
  ): Promise<void>;
  abstract delete(bucket: string, path: string): Promise<void>;
  abstract getPublicUrl(bucket: string, path: string): string;
}
