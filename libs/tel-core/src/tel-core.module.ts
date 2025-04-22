import { Module } from '@nestjs/common';
import { TelCoreService } from './tel-core.service';
import { AIModule } from '@app/ai';

@Module({
  imports: [AIModule],
  providers: [TelCoreService],
  exports: [TelCoreService],
})
export class TelCoreModule {}
