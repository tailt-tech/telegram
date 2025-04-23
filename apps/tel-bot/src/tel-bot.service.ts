import { TelCoreService } from '@app/tel-core';
import { Ctx, Hears, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { BaseLog } from '@app/shared-utils';
import { AIMode, AIService } from '@app/ai';

@Update()
export class TelBotService extends BaseLog {
  constructor(
    private readonly aiService: AIService,
    private readonly telCoreService: TelCoreService,
  ) {
    super();
  }

  private handleMessage(message: string): Promise<string> {
    return this.aiService.chat(message, AIMode.gpt4oMini20240718);
  }

  @Hears(/^[^\\/].*$/)
  async onMessage(
    @Ctx() ctx: Context & { message: Message.TextMessage },
  ): Promise<void> {
    const userMessage: string = ctx.message.text;
    this.logger.debug(
      `Received message: ${userMessage} from ${ctx.from?.username}`,
    );
    const chatId = ctx.chat?.id;
    if (!userMessage || !chatId) {
      this.logger.error('Invalid message or chat ID');
      return;
    }
    try {
      await ctx.reply('You asked: ' + userMessage);
      await ctx.reply('Thinking...');
      const reply = await this.handleMessage(userMessage);
      await ctx.reply(reply);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling message: ${errorMessage}`);
      await ctx.reply(
        'Sorry, an error occurred while processing your message.',
      );
    }
  }
}
