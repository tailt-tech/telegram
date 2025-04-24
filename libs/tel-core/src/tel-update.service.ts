import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BaseLog } from '@app/shared-utils';

const YES_RM_BTN: string = 'CONFIRM YES';
const NO_RM_BTN: string = 'CONFIRM NO';

@Update()
export class TelUpdateService extends BaseLog {
  @Start()
  async start(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      `Xin chào ${ctx.from?.username} nhé.Tôi là bot chat. Bạn có thể gửi tin nhắn cho tôi để nhận câu trả lời.`,
    );
  }

  @Help()
  async help(@Ctx() ctx: Context): Promise<void> {
    this.logger.log('Checker');
    await ctx.reply('Help');
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
