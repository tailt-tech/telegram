import { AIModeType, AIRequest, AIResponse, Role } from './ai.interface';
import { BaseService, ProxyService } from '@app/shared-utils';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@app/storage';
import { IUserTelegram, TopicCommand, TYPE_TOPIC } from '@app/tel-core';

@Injectable()
export class AIService extends BaseService {
  constructor(
    httpService: HttpService,
    configService: ConfigService,
    storageService: StorageService,
    proxyService: ProxyService,
  ) {
    super(httpService, configService, storageService, proxyService);
  }

  private async sendDataAI(url: string, body: AIRequest, userAgent: string) {
    try {
      this.logger.verbose(url, JSON.stringify(body));
      const extraHeaders = {
        'User-Agent': userAgent,
        DNT: '1',
        'Accept-Language': 'en-US,en;q=0.9',
      };
      const response = await this.postExternalData<AIResponse>(
        url,
        body,
        extraHeaders,
      );
      if (response.statusCode == 200) this.logger.log('The content processed');
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

  public async chat(
    message: string,
    mode: AIModeType,
    userAgent: string,
  ): Promise<string> {
    this.logger.verbose(message);
    if (!message.trim().length) {
      return 'Please enter a message.';
    }
    const body: AIRequest = {
      model: mode,
      messages: [{ role: Role.user, content: message }],
    };
    return await this.sendDataAI('/chat/completions', body, userAgent);
  }

  private getDescriptionByTopic(topicName: TYPE_TOPIC) {
    switch (topicName) {
      case TopicCommand.ENGLISH:
      case TopicCommand.JAPANESE:
        return `Bạn là người rất giỏi ${topicName}. Hãy giải thích theo yêu cầu`;
      case TopicCommand.CODING:
        return `Bạn là 1 developer. Hãy optimize và coding theo yêu cầu`;
      case TopicCommand.DRAW:
        return `Bạn có thể generate image theo yêu cầu`;
      default:
        return 'Bạn là người chuyên gia trong lĩnh vực này. Hãy phân tích theo yêu cầu';
    }
  }

  public async askAIML(user: IUserTelegram, message: string) {
    if (!message.trim().length) return 'Please enter a message.';

  }
  public async askTopic(
    message: string,
    systemDescription: string,
    mode: AIModeType,
    userAgent: string,
  ) {
    if (!message.trim().length) return 'Please enter a message.';
    const body: AIRequest = {
      model: mode,
      messages: [
        { role: Role.system, content: systemDescription },
        { role: Role.user, content: message },
      ],
    };
    return await this.sendDataAI('/chat/completions', body, userAgent);
  }
}
