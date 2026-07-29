import { Module } from '@nestjs/common';
import { AnimesModule } from '../animes/animes.module';
import { MuseumController } from './museum.controller';
import { MuseumService } from './museum.service';

@Module({
  imports: [AnimesModule],
  controllers: [MuseumController],
  providers: [MuseumService],
  // EntriesModule chama createFromAnimeId ao marcar uma entrada como
  // assistida (mark-watched — §6 do blueprint).
  exports: [MuseumService],
})
export class MuseumModule {}
