import { Module } from '@nestjs/common';
import { MuseumModule } from '../museum/museum.module';
import { NotificationEventsService } from './notification-events.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [MuseumModule],
  controllers: [SocialController],
  providers: [SocialService, NotificationEventsService],
})
export class SocialModule {}
