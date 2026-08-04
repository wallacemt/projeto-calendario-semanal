import { Module } from '@nestjs/common';
import { AnimesModule } from '../animes/animes.module';
import { MuseumModule } from '../museum/museum.module';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

@Module({
  imports: [AnimesModule, MuseumModule],
  controllers: [EntriesController],
  providers: [EntriesService],
  exports: [EntriesService],
})
export class EntriesModule {}
