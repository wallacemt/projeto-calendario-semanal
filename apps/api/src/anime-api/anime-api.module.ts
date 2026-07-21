import { Module } from '@nestjs/common';
import { AnimeApiService } from './anime-api.service';

@Module({
  providers: [AnimeApiService],
  exports: [AnimeApiService],
})
export class AnimeApiModule {}
