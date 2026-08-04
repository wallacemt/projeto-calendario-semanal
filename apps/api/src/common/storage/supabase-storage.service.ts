import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../config/env.schema';
import { StorageService } from './storage.service';

// Implementação concreta da porta StorageService (ADR-07). Só usa o Storage
// do Supabase — Auth/DB do Supabase não entram aqui. Service-role key nunca
// sai do backend (ela ignora RLS dos buckets).
@Injectable()
export class SupabaseStorageService extends StorageService {
  private readonly client: SupabaseClient | null;
  private readonly url: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.url = config.get('SUPABASE_URL', { infer: true });
    const key = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    this.client = this.url && key ? createClient(this.url, key) : null;
  }

  async upload(
    bucket: string,
    path: string,
    data: Buffer,
    contentType: string,
  ): Promise<void> {
    const { error } = await this.requireClient()
      .storage.from(bucket)
      .upload(path, data, { contentType, upsert: true });
    if (error)
      throw new ServiceUnavailableException(
        `Falha no upload: ${error.message}`,
      );
  }

  async delete(bucket: string, path: string): Promise<void> {
    await this.requireClient().storage.from(bucket).remove([path]);
  }

  getPublicUrl(bucket: string, path: string): string {
    return this.requireClient().storage.from(bucket).getPublicUrl(path).data
      .publicUrl;
  }

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Storage não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes).',
      );
    }
    return this.client;
  }
}
