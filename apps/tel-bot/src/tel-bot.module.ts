import { Module } from '@nestjs/common';
import { TelBotService } from './tel-bot.service';
import { TelCoreModule } from '@app/tel-core';
import { AIModule } from '@app/ai';

@Module({
  imports: [TelCoreModule, AIModule],
  providers: [TelBotService],
  exports: [TelBotService],
})
export class TelBotModule {}
