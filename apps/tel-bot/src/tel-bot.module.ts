import { Module } from '@nestjs/common';
import { TelBotService } from './tel-bot.service';
import { TelCoreModule } from '@app/tel-core';
import { AIModule } from '@app/ai';
import { CoreModule } from '@app/shared-utils/core.module';

@Module({
  imports: [TelCoreModule, AIModule, CoreModule],
  providers: [TelBotService],
  exports: [TelBotService],
})
export class TelBotModule {}
