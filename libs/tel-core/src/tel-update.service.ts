import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BaseLog } from '@app/shared-utils';
import {
  BotCommand,
  MENU_REPLY,
  MENU_TOPIC,
  ReplyUser,
  TopicCommand,
  TYPE_TOPIC,
} from '@app/tel-core/tel-core.interface';
import { Message } from 'telegraf/typings/core/types/typegram';
import { AIMode, AIService } from '@app/ai';

const YES_RM_BTN: string = 'CONFIRM YES';
const NO_RM_BTN: string = 'CONFIRM NO';

@Update()
export class TelUpdateService extends BaseLog {
  constructor(private readonly aiService: AIService) {
    super();
  }
  @Start()
  async start(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      `Xin chào ${ctx.from?.username} nhé.Tôi là bot chat. Bạn có thể gửi tin nhắn cho tôi để nhận câu trả lời.`,
    );
  }

  @Help()
  async help(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('🤖 Mời bạn chọn:', MENU_REPLY);
  }

  /**
   *  MENU OPTIONS WITH ACTIONS
   * @param ctx
   */
  @Action(BotCommand.INFO)
  async onInfo(@Ctx() ctx: Context) {
    await ctx.reply('👨‍🏫 Tôi là một người máy đang học hỏi');
  }

  @Action(BotCommand.MENU)
  async onMenu(@Ctx() ctx: Context) {
    await ctx.reply('📋 Menu đang cập nhật');
  }

  @Action(BotCommand.TOPIC)
  async onTopic(@Ctx() ctx: Context) {
    await ctx.reply('💬️ Vui lòng chọn chủ đề sau:', MENU_TOPIC);
  }

  @Action(Object.values(TopicCommand))
  async onMenuTopic(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const user = ctx.from?.first_name ?? 'Bạn';
    const callBack = ctx.callbackQuery;
    if (callBack && 'data' in callBack) {
      const topicName = callBack.data as TYPE_TOPIC;
      const received = ReplyUser(user, topicName);
      await ctx.reply(received.msg);
      const reply = await this.aiService.askTopic(
        topicName,
        received.msg,
        AIMode.gpt4oMini20240718,
      );
      await ctx.reply(reply);
    } else {
      await ctx.reply(
        `${user} ơi, Hiện tại tôi đang có vẫn đề chưa thể trả lời được.`,
      );
    }
  }

  @Action('like')
  async like(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Thanks!');
  }

  @Action('dislike')
  async dislike(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery('Disliked!. Tại sao?. Why?....どうして？');
  }

  @Command('removeAllKey')
  async removeAllKey(@Ctx() ctx: Context) {
    await ctx.reply(
      'Bạn có chắc chắn muốn xóa tất cả key không?',
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Yes', YES_RM_BTN)],
        [Markup.button.callback('❌ No', NO_RM_BTN)],
      ]),
    );
  }

  @Action(YES_RM_BTN)
  async handleConfirmRemoveKey(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Đã xóa tất cả key thành công!');
  }

  @Action(NO_RM_BTN)
  async handleCancelRemoveKey(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Đã hủy thao tác xoá key.');
  }
}
