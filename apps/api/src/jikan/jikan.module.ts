import { Module } from '@nestjs/common';
import { JikanService } from './jikan.service';

@Module({
  providers: [JikanService],
  exports: [JikanService],
})
export class JikanModule {}
