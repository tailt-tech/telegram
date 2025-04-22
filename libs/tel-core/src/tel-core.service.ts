import { Injectable } from '@nestjs/common';
import { AIMode, AIService } from '@app/ai';

@Injectable()
export class TelCoreService {
  constructor(private readonly aiService: AIService) {}

  handleMessage(message: string): Promise<string> {
    return this.aiService.chat(message, AIMode.gpt4oMini20240718);
  }
}
