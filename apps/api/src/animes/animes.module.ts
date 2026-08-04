import { Module } from '@nestjs/common';
import { AnimeApiModule } from '../anime-api/anime-api.module';
import { AnimesController } from './animes.controller';
import { AnimesService } from './animes.service';

@Module({
  imports: [AnimeApiModule],
  controllers: [AnimesController],
  providers: [AnimesService],
  // EntriesModule reaproveita getByMalId (upsert do espelho local) ao
  // adicionar uma entrada ao calendário — não duplica a lógica de "buscar e
  // cachear" que já existe aqui (M3).
  exports: [AnimesService],
})
export class AnimesModule {}
