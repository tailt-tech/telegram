import { Command, Ctx, Hears, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { BaseLog } from '@app/shared-utils';
import { AIMode, AIService } from '@app/ai';
import { IDataKey, REDIS_QUEUE_NAME, StorageService } from '@app/storage';

@Update()
export class TelBotService extends BaseLog {
  private userStates = new Map<number, string>();
  private readonly WAITING_KEY = 'WAITING';

  constructor(
    private readonly aiService: AIService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  private handleMessage(message: string): Promise<string> {
    return this.aiService.chat(message, AIMode.gpt4oMini20240718);
  }

  @Hears(/^(?!\/|key:).+/i)
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

  @Command('addKey')
  onAddKey(@Ctx() ctx: Context & { message: Message.TextMessage }): void {
    const userId = ctx.message.from.id;
    this.logger.debug(`Listen add key from ${userId}`);
    this.userStates.set(userId, this.WAITING_KEY);
  }

  @Command('removeKey')
  onRemoveKey(@Ctx() ctx: Context & { message: Message.TextMessage }): void {
    const userId = ctx.message.from.id;
    this.userStates.delete(userId);
  }

  @On('text')
  async onSaveKey(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const userId = ctx.message.from.id;
    const state = this.userStates.get(userId);
    if (state === this.WAITING_KEY) {
      const keys = ctx.message.text;
      this.userStates.delete(userId);
      const keyList: string[] = keys.split(', ').map((keys) => keys.trim());
      const payload: IDataKey[] = [];
      keyList.forEach((key: string) => {
        const itemDateKey: IDataKey = {
          codeStatus: 200,
          startTime: Date.now(),
          value: key,
        };
        payload.push(itemDateKey);
      });
      await this.storageService.addKeysToQueue(
        REDIS_QUEUE_NAME.ACTIVE,
        payload,
      );
      await ctx.reply('Key saved is success');
    } else {
      await ctx.reply(
        'Send key with format: abc, bdc,.... If you want to cancel, try send command removeKey',
      );
    }
  }
}
