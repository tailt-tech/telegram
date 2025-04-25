import { Module } from '@nestjs/common';
import { TelBotService } from './tel-bot.service';
import { TelCoreModule } from '@app/tel-core';
import { TelUpdateService } from '@app/tel-core/tel-update.service';
import { AIModule } from '@app/ai';

@Module({
  imports: [AIModule, TelCoreModule],
  providers: [TelBotService, TelUpdateService],
  exports: [TelBotService],
})
export class TelBotModule {}
