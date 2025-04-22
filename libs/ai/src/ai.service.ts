import { AIModeType, AIRequest, AIResponse, Role } from './ai.interface';
import { BaseService } from '@app/shared-utils';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService extends BaseService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService);
  }

  public async chat(message: string, mode: AIModeType): Promise<string> {
    if (!message.trim().length) {
      return 'Please enter a message.';
    }
    const body: AIRequest = {
      model: mode,
      messages: [{ role: Role.user, content: message }],
    };
    try {
      const response = await this.postExternalData<AIResponse>(
        '/chat/completions',
        body,
      );
      if (!response.data) return response.msg;
      const msgs = response.data.choices?.map(
        (choice) => choice.message.content,
      );
      return msgs.join('\n');
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(msg);
      return 'Sorry, I am unable to process your request at the moment. Please try again later.';
    }
  }
}
