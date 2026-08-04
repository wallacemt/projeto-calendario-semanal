import { Module } from '@nestjs/common';
import { StorageModule } from '../common/storage/storage.module';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';

@Module({
  imports: [StorageModule],
  controllers: [ThemesController],
  providers: [ThemesService],
})
export class ThemesModule {}
