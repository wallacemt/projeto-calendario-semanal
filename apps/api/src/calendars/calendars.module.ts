import { Module } from '@nestjs/common';
import { CalendarsController } from './calendars.controller';

@Module({
  controllers: [CalendarsController],
})
export class CalendarsModule {}
