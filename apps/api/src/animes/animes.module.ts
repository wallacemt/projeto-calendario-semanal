import { Module } from '@nestjs/common';
import { JikanModule } from '../jikan/jikan.module';
import { AnimesController } from './animes.controller';
import { AnimesService } from './animes.service';

@Module({
  imports: [JikanModule],
  controllers: [AnimesController],
  providers: [AnimesService],
})
export class AnimesModule {}
