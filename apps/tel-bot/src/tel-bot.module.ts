import { Module } from '@nestjs/common';
import { TelCoreModule, TelCoreService } from '@app/tel-core';

@Module({
  imports: [TelCoreModule],
  providers: [TelCoreService],
  exports: [TelCoreService],
})
export class TelBotModule {}
