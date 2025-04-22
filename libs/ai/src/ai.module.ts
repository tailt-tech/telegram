import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { BaseModule } from '@app/shared-utils';

@Module({
  imports: [BaseModule],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
