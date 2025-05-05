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
import {
  IDataActive,
  IDataKey,
  REDIS_QUEUE_NAME,
  StorageService,
} from '@app/storage';
import {
  BotCommand,
  CallbackDataKey,
  CONFIRMATION_MENU,
  decodeCallbackData,
  decodeCallbackDataKey,
  KeyCommand,
  MENU_MENU,
  MENU_REPLY,
  MENU_TOPIC,
  MenuCommand,
  regexCallData,
  regexCallDataKey,
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
  private readonly ICON_QS = '🤚'; // :raise_hand:
  private topicName: TYPE_TOPIC;

  constructor(
    @InjectBot() private readonly botTel: Telegraf,
    private readonly telUpdateService: TelUpdateService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async getKeysActive(): Promise<string> {
    const storageCaching: string[] =
      await this.storageService.getAllKeysInQueue(REDIS_QUEUE_NAME.ACTIVE);
    if (!storageCaching) {
      return '';
    }
    const keysCaching: string[] = [];
    for (const item of storageCaching) {
      try {
        const data: IDataKey = JSON.parse(item) as IDataKey;
        const value = data.value;
        keysCaching.push(value);
      } catch (e) {
        this.logger.error(`Invalid JSON item in queue: `, item, e);
      }
    }
    return keysCaching.join('\n');
  }
  async addAllKeys(keys: string = '') {
    if (!keys) return false;
    const keysCaching = await this.storageService.hasKeysActiveList();
    if (!keysCaching) {
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
      await this.storageService.addKeysToQueue(
        REDIS_QUEUE_NAME.ACTIVE,
        apiKeys,
      );
    }
    return true;
  }

  async restoreAllKeys(keys: string = '') {
    if (!keys) return false;
    const keysCaching = await this.storageService.hasKeysActiveList();
    if (keysCaching) {
      await this.storageService.removeAllKeyInQueue(REDIS_QUEUE_NAME.ACTIVE);
    }
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
  }

  @Action(BotCommand.MENU)
  async onMenu(@Ctx() ctx: Context) {
    await ctx.reply('📋 Vui lòng chọn:', MENU_MENU);
  }

  @Action(BotCommand.TOPIC)
  async onTopic(@Ctx() ctx: Context) {
    await ctx.reply('💬️ Vui lòng chọn chủ đề sau:', MENU_TOPIC);
  }

  @Action(BotCommand.MODEL)
  async onModel(@Ctx() ctx: Context) {
    await ctx.reply('🤖 Vui lòng chọn model sau:');
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
      await this.actionContext(received, ctx);
    }
  }

  private async actionContext(payload: CallbackDataKey, ctx: Context) {
    const { suffix } = payload;
    const keys = await this.getDescription();
    switch (suffix) {
      case KeyCommand.Add:
        await this.addAllKeys(keys);
        await ctx.reply('Thêm key thành công');
        break;
      case KeyCommand.List:
        await ctx.reply('Danh sách key');
        await this.showListKeyCaching(ctx);
        break;
      case KeyCommand.Remove:
        await this.storageService.removeAllKeyInQueue(REDIS_QUEUE_NAME.ACTIVE);
        await ctx.reply('Xóa key thành công');
        break;
      case KeyCommand.Restore:
        await this.restoreAllKeys(keys);
        await ctx.reply('Khôi phục key thành công');
        break;
      default:
        await ctx.reply('Khong tim thay');
    }
  }
  private async showListKeyCaching(@Ctx() ctx: Context) {
    const keys = await this.getKeysActive();
    if (!keys) {
      await ctx.reply('Không có key nào được lưu trữ');
      return;
    }
    await ctx.reply(keys);
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
        `Bạn muốn hỏi gì nhỉ. Nếu cần hỏi theo chủ đề thì sau khi chọn bạn sẽ mở đầu bằng ${this.ICON_QS} (:raise_hand:)`,
      );
      this.topicName = topicName;
      await this.setTopicActive(ctx, topicName, received.msg);
    } else {
      await ctx.reply(
        `${user} ơi, Hiện tại tôi đang có vẫn đề chưa thể trả lời được.`,
      );
    }
  }

  async onQuestionTopic(
    @Ctx() ctx: Context & { message: Message.TextMessage },
  ) {
    const qs = ctx.message.text.split(`${this.ICON_QS}`);
    const ques = qs[1];
    const username = ctx.from?.first_name ?? 'Bạn';
    if (!ques) await ctx.reply(`${username} nói gì vậy`);
    else {
      const sysDescription = await this.getTopicActiveDescription(ctx);
      const reply = await this.telUpdateService.handleMessageWithTopic(
        ques,
        sysDescription ?? '',
      );
      await ctx.reply(reply);
    }
  }

  @On('text')
  async onChatGroup(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const text = ctx.message?.text || '';
    const raiseHand = text.startsWith(`${this.ICON_QS}`);
    if (!raiseHand) {
      const reply = await this.telUpdateService.handleMessage(
        ctx.message?.text,
      );
      await ctx.reply(reply);
    } else {
      await this.onQuestionTopic(ctx);
    }
  }

  private async setTopicActive(
    @Ctx() ctx: Context,
    key: string,
    value: string,
  ) {
    const userId = ctx.callbackQuery?.from.id;
    if (!userId) return false;
    const payload: IDataActive = { key, value };
    await this.storageService.setTopicActive(userId, payload);
  }

  private async getTopicActiveDescription(
    @Ctx() ctx: Context,
  ): Promise<string> {
    const userId = ctx.message?.from.id;
    if (!userId) return '';
    const topicActive = await this.storageService.getTopicActive(userId);
    if (!topicActive.success) return '';
    return topicActive?.data?.value ?? '';
  }
}
