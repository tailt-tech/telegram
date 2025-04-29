import { Module } from '@nestjs/common';
import { TelCoreModule, TelCoreService } from '@app/tel-core';
import { CoreModule } from '@app/shared-utils/core.module';

@Module({
  imports: [CoreModule, TelCoreModule],
  providers: [TelCoreService, TelCoreService],
  exports: [TelCoreService],
})
export class TelBotModule {}
