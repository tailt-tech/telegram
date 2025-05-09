import {
  Action,
  Ctx,
  Hears,
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
  ActionKeyCommand,
  BotCommand,
  CallbackDataKey,
  CONFIRMATION_MENU,
  decodeCallback,
  decodeCallbackData,
  decodeCallbackDataKey,
  IBotTelegram,
  ICallbackData,
  IUserTelegram,
  KeyCommand,
  MENU_MENU,
  MENU_REPLY,
  MENU_TOPIC,
  MenuCommand,
  regexCallData,
  regexCallDataAgent,
  regexCallDataKey,
  regexTopic,
  regexTopicRemove,
  ReplyUser,
  ReplyUserKey,
  TopicCommand,
  TYPE_MENU,
  TYPE_TOPIC,
} from '@app/tel-core/tel-core.interface';
import { getUserAgent } from '@rahulxf/random-user-agent/dist/generateUserAgents';
import { AIModelName, AIModeType } from '@app/ai';

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

  @Start()
  async start(
    @Ctx() ctx: Context & { message: Message.TextMessage },
  ): Promise<void> {
    await this.getBotInfoChat();
    const user: IUserTelegram = this.getUserChat(ctx.message);
    const bot: IBotTelegram = await this.getBotInfoChat();
    await ctx.reply(
      `Xin chào ${user.first_name} ${user.last_name} nhé.🎊
      Tôi là ${bot.first_name} 🤖. Bạn có thể gửi tin nhắn cho tôi để nhận câu trả lời.`,
    );
    await ctx.reply('Ngoài ra, bạn có thể chọn các tùy chọn sau:', MENU_REPLY);
    await this.updateUserAgent(user);
    await this.updateAIMLKey(user);
    await this.updateAIModel(user);
    await this.storageService.setTopicUserActive(user, 'general');
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

  @Action(regexCallDataAgent)
  async onConfirmYesAgent(@Ctx() ctx: Context) {
    const userChat: IUserTelegram = {
      first_name: ctx.from?.first_name ?? '',
      id: ctx.from?.id ?? 0,
      username: ctx.from?.username ?? '',
    };
    const callBack = ctx.callbackQuery;
    if (callBack && 'data' in callBack) {
      const received = decodeCallback(callBack.data, userChat);
      if (!received) {
        await ctx.reply('Không thể xử lý lệnh này');
        return;
      }
      const msg = await this.processUserAgent(received);
      await ctx.reply(msg);
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

  private async onQuestionTopic(
    @Ctx() ctx: Context & { message: Message.TextMessage },
    userAgent: string,
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
        userAgent,
      );
      await ctx.reply(reply);
    }
  }

  @Hears('/topic')
  async onTopicCMD(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const user: IUserTelegram = this.getUserChat(ctx.message);
    await this.listTopic(user, ctx);
    await ctx.reply(
      `👨‍💻 ${user.username} want to create a topic then let start with the first word （例えば： #tech)`,
    );
    await ctx.reply(
      `👨‍${user.username} want to remove a topic then let start with the first word and end word by -（例えば： #tech-)`,
    );
  }

  @Hears(regexTopicRemove)
  async oneTopicRemove(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const text = ctx.message?.text || '';
    const match = text.match(regexTopicRemove);
    console.log(match);
    if (!match) {
      await ctx.reply(`Không tìm thấy lệnh này`);
      return;
    }
    const user: IUserTelegram = this.getUserChat(ctx.message);
    const topicName = match[1];
    await this.storageService.dropTopicUser(user, topicName);
    await ctx.reply(`User ${user.first_name} đã remove chủ đề ${topicName}`);
  }

  @Hears(regexTopic)
  async onTopicCreate(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const text = ctx.message?.text || '';
    const match = text.match(regexTopic);
    if (!match) {
      await ctx.reply(`Không tìm thấy lệnh này`);
      return;
    }
    const topicName = match[1];
    const user: IUserTelegram = this.getUserChat(ctx.message);
    await this.storageService.pushTopicUser(user, topicName);
    await this.storageService.setTopicUserActive(user, topicName);
    await ctx.reply(`User ${user.first_name} đã chọn chủ đề ${topicName}`);
  }

  @On('text')
  async onChatGroup(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const user: IUserTelegram = this.getUserChat(ctx.message);
    const userAgent = await this.storageService.getUserAgent(user);
    if (!userAgent)
      await ctx.reply(
        `Bạn chưa có user agent. Vui lòng chọn user agent để bắt đầu hỏi đáp.`,
      );
    else {
      const topicActive = await this.storageService.getTopicUserActive(user);
      await this.storageService.chatCaching(
        user,
        ctx.message?.text,
        topicActive,
      );
      const sessionHistories = await this.storageService.jsonSessionGet(
        user.id.toString(),
        topicActive,
      );
      let msgNew = ctx.message?.text;
      if (sessionHistories.success) {
        msgNew =
          typeof sessionHistories.data === 'string'
            ? sessionHistories.data + ', ' + msgNew
            : '';
      }
      const reply = await this.telUpdateService.handleMessage(
        msgNew,
        userAgent,
      );
      await ctx.reply(reply);
      // const raiseHand = text.startsWith(`${this.ICON_QS}`);
      // if (!raiseHand) {
      //   const reply = await this.telUpdateService.handleMessage(
      //     ctx.message?.text,
      //     userAgent,
      //   );
      //   await ctx.reply(reply);
      // } else {
      //   await this.onQuestionTopic(ctx, userAgent);
      // }
    }
  }

  @On(['photo', 'video', 'document', 'audio'])
  onFileUpload(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    console.log(ctx);
  }

  /*Function Process*/
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
    return typeof topicActive.data === 'object' ? topicActive.data.value : '';
  }

  private async getKeysActive(): Promise<string> {
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

  private async addAllKeys(keys: string = '') {
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

  private async restoreAllKeys(keys: string = '') {
    if (!keys) return false;
    const keysCaching = await this.storageService.hasKeysActiveList();
    if (keysCaching) {
      await this.storageService.removeAllKeyInQueue(REDIS_QUEUE_NAME.ACTIVE);
    }
    const apiKeys: IDataKey[] = keys.split(',').map((key) => {
      const timestamp = Date.now();
      const item: IDataKey = {
        codeStatus: 200,
        startTime: timestamp,
        value: key,
      };
      return item;
    });
    if (!apiKeys.length) return false;
    await this.storageService.addKeysToQueue(REDIS_QUEUE_NAME.ACTIVE, apiKeys);
    return true;
  }

  private async getDescription() {
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

  private async processUserAgent(payload: ICallbackData) {
    const { user, suffix, action } = payload;
    switch (action) {
      case ActionKeyCommand.Add:
        await this.updateUserAgent(user, true);
        break;
      case ActionKeyCommand.Remove:
        // await this.removeUserAgent(user, timestamp);
        break;
      default:
        break;
    }
    return `Đã ${action} ${suffix} cho ${user.username}`;
  }

  private async updateUserAgent(user: IUserTelegram, force = false) {
    const userAgent = getUserAgent() ?? '';
    if (!userAgent) {
      throw new Error('Không tìm thấy userAgent');
    }
    if (force) {
      await this.storageService.setUserAgent(user, userAgent);
      return true;
    }
    const userAgentCaching = await this.storageService.getUserAgent(user);
    if (userAgentCaching) {
      return true;
    }
    await this.storageService.setUserAgent(user, userAgent);
  }

  private getUserChat(message: Message.TextMessage) {
    const fromChat = message.from;
    if (!fromChat) {
      throw new Error('Không tìm thấy người dùng');
    }
    const user: IUserTelegram = {
      id: fromChat.id || 0,
      username: fromChat.username || '',
      first_name: fromChat.first_name || '',
      last_name: fromChat.last_name || '',
    };
    return user;
  }

  private async getBotInfoChat() {
    const botInfo = await this.botTel.telegram.getMe();
    if (!botInfo) {
      throw new Error('Failed to get bot info');
    }
    const botChat: IBotTelegram = {
      first_name: botInfo.first_name || '',
      id: botInfo.id || 0,
      last_name: botInfo.last_name || '',
      username: botInfo.username || '',
    };
    return botChat;
  }

  private async updateAIMLKey(user: IUserTelegram) {
    let apiKey = await this.storageService.getKeyAIML(user);
    if (!apiKey) {
      const data = await this.storageService.popFromQueue<IDataKey>(
        REDIS_QUEUE_NAME.ACTIVE,
      );
      apiKey = data?.value ?? '';
      if (!apiKey) {
        return '';
      }
      await this.storageService.setKeyAIML(user, apiKey.trim());
    }
    return apiKey.trim();
  }

  private async updateAIModel(user: IUserTelegram) {
    const modelInit: AIModeType = AIModelName.gpt4oMini;
    await this.storageService.updateModelActive(user, modelInit);
  }

  private async listTopic(user: IUserTelegram, ctx: Context) {
    const result = await this.storageService.getTopics(user);
    if (result.success) {
      const payload = typeof result.data === 'string' ? result.data : '';
      await ctx.reply(result.message);
      await ctx.reply(payload);
    } else await ctx.reply('Không có chủ đề nào được tạo');
  }
}
