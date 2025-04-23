import { Module } from '@nestjs/common';
import { TelBotService } from './tel-bot.service';
import { TelCoreModule } from '@app/tel-core';
import { StorageModule } from '@app/storage';
import { AIModule } from '@app/ai';

@Module({
  imports: [TelCoreModule, AIModule, StorageModule],
  providers: [TelBotService],
  exports: [TelBotService],
})
export class TelBotModule {}
