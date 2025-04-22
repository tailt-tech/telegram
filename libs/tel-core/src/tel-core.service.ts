import { Injectable } from '@nestjs/common';
import { AIMode, AIService } from '@app/ai';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BaseLog } from '@app/shared-utils';
import pRetry from 'p-retry';

@Injectable()
export class TelCoreService extends BaseLog {
  constructor(
    private readonly aiService: AIService,
    @InjectBot() private readonly botTel: Telegraf,
  ) {
    super();
  }

  handleMessage(message: string): Promise<string> {
    return this.aiService.chat(message, AIMode.gpt4oMini20240718);
  }

  async getBotInfo(): Promise<string> {
    const checkInfo = async () => {
      const botInfo = await this.botTel.telegram.getMe();
      if (!botInfo) {
        throw new Error('Failed to get bot info');
      }
      return botInfo.username;
    };
    return await pRetry(checkInfo, {
      onFailedAttempt: (error) => {
        this.logger.error(`Attempt ${error.attemptNumber} failed. Retrying...`);
      },
      retries: 3,
    });
  }
}
