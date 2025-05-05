import {
  Action,
  Command,
  Ctx,
  Help,
  InjectBot,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import pRetry from 'p-retry';
import { TelUpdateService } from '@app/tel-core/tel-update.service';
import { BaseLog } from '@app/shared-utils';
import { Message } from 'telegraf/typings/core/types/typegram';
import { IDataKey, REDIS_QUEUE_NAME, StorageService } from '@app/storage';
import {
  BotCommand,
  CONFIRMATION_MENU,
  decodeCallbackData,
  decodeCallbackDataKey,
  MENU_MENU,
  MENU_REPLY,
  MENU_TOPIC,
  MenuCommand,
  regexCallData,
  regexCallDataKey,
  regexQuestion,
  ReplyUser,
  ReplyUserKey,
  TopicCommand,
  TYPE_MENU,
  TYPE_TOPIC,
} from '@app/tel-core/tel-core.interface';

@Update()
export class TelCoreService extends BaseLog {
  private userStates = new Map<number, string>();
  private readonly WAITING_KEY = 'WAITING';
  private topicName: TYPE_TOPIC;

  constructor(
    @InjectBot() private readonly botTel: Telegraf,
    private readonly telUpdateService: TelUpdateService,
    private readonly storageService: StorageService,
  ) {
    super();
    this.checkKeys();
  }
  async checkKeys() {
    const keys = await this.getDescription();
    if (!keys) return false;
    const apiKeys: IDataKey[] = keys.split(',').map((key) => {
      const timestame = Date.now();
      const item: IDataKey = {
        codeStatus: 200,
        startTime: timestame,
        value: key,
      };
      return item;
    });
    if (!apiKeys.length) return false;
    await this.storageService.addKeysToQueue(REDIS_QUEUE_NAME.ACTIVE, apiKeys);
    return true;
  }

  async getDescription() {
    const checkInfo = async () => {
      const botInfo = await this.botTel.telegram.getMyDescription();
      if (!botInfo) {
        throw new Error('Failed to get bot info');
      }
      return botInfo.description;
    };
    return await pRetry(checkInfo, {
      onFailedAttempt: (error) => {
        this.logger.error(`Attempt ${error.attemptNumber} failed. Retrying...`);
      },
      retries: 2,
    });
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

  @Start()
  async start(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      `Xin chào ${ctx.from?.username} nhé.Tôi là bot chat. Bạn có thể gửi tin nhắn cho tôi để nhận câu trả lời.`,
    );
  }

  @Help()
  async help(@Ctx() ctx: Context): Promise<void> {
    this.logger.debug('Help command received');
    await ctx.reply('🤖 Mời bạn chọn:', MENU_REPLY);
  }

  // @On('text')
  // async onSaveKey(@Ctx() ctx: Context & { message: Message.TextMessage }) {
  //   const text = ctx.message.text;
  //   if (text.startsWith('/')) return;
  //   const userId = ctx.message.from.id;
  //   const state = this.userStates.get(userId);
  //   if (state === this.WAITING_KEY) {
  //     const keys = ctx.message.text;
  //     this.userStates.delete(userId);
  //     const keyList: string[] = keys.split(', ').map((keys) => keys.trim());
  //     const payload: IDataKey[] = [];
  //     keyList.forEach((key: string) => {
  //       const itemDateKey: IDataKey = {
  //         codeStatus: 200,
  //         startTime: Date.now(),
  //         value: key,
  //       };
  //       payload.push(itemDateKey);
  //     });
  //     await this.storageService.addKeysToQueue(
  //       REDIS_QUEUE_NAME.ACTIVE,
  //       payload,
  //     );
  //     await ctx.reply('Key saved is success');
  //   } else {
  //     await ctx.reply(
  //       'Send key with format: abc, bdc,.... If you want to cancel, try send command removeKey',
  //     );
  //   }
  // }
  /**
   *  MENU OPTIONS WITH ACTIONS
   * @param ctx
   */
  @Action(BotCommand.INFO)
  async onInfo(@Ctx() ctx: Context) {
    await ctx.reply(
      '👨‍🏫 Tôi là một người máy đang học hỏi.\n' +
        '👨‍ Key của bạn đã được lưu trữ trong hệ thống',
    );
    const keys = (await this.getDescription()) ?? '';
    if (keys) {
      await ctx.reply(keys);
    }
  }

  @Action(BotCommand.MENU)
  async onMenu(@Ctx() ctx: Context) {
    await ctx.reply('📋 Vui lòng chọn:', MENU_MENU);
  }

  @Action(BotCommand.TOPIC)
  async onTopic(@Ctx() ctx: Context) {
    await ctx.reply('💬️ Vui lòng chọn chủ đề sau:', MENU_TOPIC);
  }

  @Action(Object.values(MenuCommand))
  async onMenuMenu(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const user = ctx.from?.first_name ?? 'Bạn';
    const callBack = ctx.callbackQuery;
    if (callBack && 'data' in callBack) {
      const topicName = callBack.data as TYPE_MENU;
      const received = ReplyUserKey(user, topicName);
      await ctx.reply(received.msg, CONFIRMATION_MENU(topicName));
    }
  }

  @Action(regexCallData)
  async onConfirmYes(@Ctx() ctx: Context) {
    const callBack = ctx.callbackQuery;
    if (callBack && 'data' in callBack) {
      const received = decodeCallbackData(callBack.data);
      if (!received) {
        await ctx.reply('Không thể xử lý lệnh này');
        return;
      }
      await ctx.reply(JSON.stringify(received));
      await this.telUpdateService.handleSwitchMenu(received, ctx);
    }
  }
  @Action(regexCallDataKey)
  async onConfirmYesKey(@Ctx() ctx: Context) {
    const callBack = ctx.callbackQuery;
    if (callBack && 'data' in callBack) {
      const received = decodeCallbackDataKey(callBack.data);
      if (!received) {
        await ctx.reply('Không thể xử lý lệnh này');
        return;
      }
      await ctx.reply(JSON.stringify(received));
      await this.telUpdateService.handleSwitchKey(received, ctx);
    }
  }

  @Action(Object.values(TopicCommand))
  async onMenuTopic(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const keyAPI = await this.telUpdateService.getAPIKeyAI();
    if (!keyAPI) await ctx.reply(`Vui lòng add key AI`);
    const user = ctx.from?.first_name ?? 'Bạn';
    const callBack = ctx.callbackQuery;
    if (callBack && 'data' in callBack) {
      const topicName = callBack.data as TYPE_TOPIC;
      const received = ReplyUser(user, topicName);
      await ctx.reply(received.msg);
      await this.storageService.setSysDescriptionCaching({
        key: topicName,
        value: received.msg,
      });
      await ctx.reply(
        'Bạn muốn hỏi gì nhỉ. Nếu cần hỏi theo chủ đề thì sau khi chọn bạn sẽ mở đầu bằng qs: 例えば: qs:<???>',
      );
      this.topicName = topicName;
    } else {
      await ctx.reply(
        `${user} ơi, Hiện tại tôi đang có vẫn đề chưa thể trả lời được.`,
      );
    }
  }

  async onQuestionTopic(
    @Ctx() ctx: Context & { message: Message.TextMessage },
  ) {
    const qs = ctx.message.text.split('🙋️️');
    const ques = qs[1];
    const username = ctx.from?.first_name ?? 'Bạn';
    if (!ques) await ctx.reply(`${username} nói gì vậy`);
    await ctx.reply('hoi topic');
    const sysDescription = await this.storageService.getSysDescriptionCaching(
      this.topicName,
    );
    const reply = await this.telUpdateService.handleMessageWithTopic(
      ques,
      sysDescription ?? '',
    );
    await ctx.reply(reply);
  }

  @Action('like')
  async like(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Thanks!');
  }

  @Action('dislike')
  async dislike(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Disliked!. Tại sao?. Why?....どうして？');
  }

  @On('text')
  async onChatGroup(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const text = ctx.message?.text || '';
    const emojoi = text.startsWith('🙋️');
    if (!emojoi) {
      const reply = await this.telUpdateService.handleMessage(
        ctx.message?.text,
      );
      await ctx.reply(reply);
    } else {
      await this.onQuestionTopic(ctx);
    }
  }

  @Command('addKey')
  async onAddKey(@Ctx() ctx: Context) {
    const userId = ctx.message?.from.id;
    await ctx.reply('Bạn có muốn thêm key?');
    this.logger.debug(`Listen add key from ${userId}`);
  }
}
