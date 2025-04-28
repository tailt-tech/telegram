import { BaseLog } from '@app/shared-utils';
import { AIMode, AIModeType, AIService } from '@app/ai';
import { Injectable } from '@nestjs/common';
import { TYPE_TOPIC } from '@app/tel-core/tel-core.interface';

@Injectable()
export class TelUpdateService extends BaseLog {
  constructor(private readonly aiService: AIService) {
    super();
  }

  public handleMessage(message: string): Promise<string> {
    return this.aiService.chat(message, AIMode.gpt4oMini20240718);
  }

  public async handleMessageWithTopic(
    topicName: TYPE_TOPIC,
    message: string,
    model: AIModeType = AIMode.gpt4oMini20240718,
  ) {
    return await this.aiService.askTopic(topicName, message, model);
  }
}
