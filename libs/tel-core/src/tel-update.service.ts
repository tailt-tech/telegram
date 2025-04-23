import { Action, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BaseLog } from '@app/shared-utils';
import { Injectable } from '@nestjs/common';

@Update()
@Injectable()
export class TelUpdateService extends BaseLog {
  constructor() {
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
}
