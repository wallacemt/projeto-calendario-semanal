import { Module } from '@nestjs/common';
import { JikanModule } from '../jikan/jikan.module';
import { AnimesController } from './animes.controller';
import { AnimesService } from './animes.service';

@Module({
  imports: [JikanModule],
  controllers: [AnimesController],
  providers: [AnimesService],
  // EntriesModule reaproveita getByMalId (upsert do espelho local) ao
  // adicionar uma entrada ao calendário — não duplica a lógica de "buscar no
  // Jikan e cachear" que já existe aqui (M3).
  exports: [AnimesService],
})
export class AnimesModule {}
