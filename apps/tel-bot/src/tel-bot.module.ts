import { Module } from '@nestjs/common';
import { TelBotService } from './tel-bot.service';
import { TelCoreModule } from '@app/tel-core';

@Module({
  imports: [TelCoreModule],
  providers: [TelBotService],
  exports: [TelBotService],
})
export class TelBotModule {}
