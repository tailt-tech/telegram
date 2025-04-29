import { BaseLog } from '@app/shared-utils';
import { AIMode, AIModeType, AIService } from '@app/ai';
import { Injectable } from '@nestjs/common';
import {
  CallbackData,
  CallbackDataKey,
  KeyCommand,
  MENU_SECOND,
  MenuCommand,
  ReplyUserKey,
  TYPE_TOPIC,
} from '@app/tel-core/tel-core.interface';
import { Context } from 'telegraf';

@Injectable()
export class TelUpdateService extends BaseLog {
  constructor(private readonly aiService: AIService) {
    super();
  }

  public handleMessage(message: string): Promise<string> {
    return this.aiService.chat(message, AIMode.gpt4oMini20240718);
  }

  public async handleMessageWithTopic(
    topicName: TYPE_TOPIC,
    message: string,
    model: AIModeType = AIMode.gpt4oMini20240718,
  ) {
    return await this.aiService.askTopic(topicName, message, model);
  }

  public async handleSwitchMenu(payload: CallbackData, ctx: Context) {
    const { timestamp, choice, suffix } = payload;
    const response = ReplyUserKey('Bạn', suffix);
    const message = response.msg;
    if (choice === 'NO') {
      await ctx.reply(`${message} đã bị từ chối`);
      return;
    }
    switch (suffix) {
      case MenuCommand.KEY:
        this.logger.debug(MENU_SECOND(timestamp).reply_markup.inline_keyboard);
        await ctx.reply('Xin moi chon chuc nang', MENU_SECOND(timestamp));
        break;
      default:
        await ctx.reply('Chưa hỗ trợ');
        break;
    }
  }
  public async handleSwitchKey(payload: CallbackDataKey, ctx: Context) {
    const { suffix } = payload;
    switch (suffix) {
      case KeyCommand.Add:
        await this.addKey(ctx);
        break;
      case KeyCommand.Remove:
        await this.removeKey(ctx);
        break;
      case KeyCommand.Restore:
        await this.restoreKey(ctx);
        break;
      default:
        await ctx.reply('Khong tim thay');
    }
  }
  private async addKey(ctx: Context) {
    await ctx.reply('Nhap key');
  }
  private async removeKey(ctx: Context) {
    await ctx.reply('Remove key');
  }
  private async restoreKey(ctx: Context) {
    await ctx.reply('Restore key');
  }
}
