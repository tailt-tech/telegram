import { BaseLog } from '@app/shared-utils';
import { AIModelName, AIModeType, AIService } from '@app/ai';
import { Injectable } from '@nestjs/common';
import {
  CallbackData,
  MENU_SECOND,
  MenuCommand,
  ReplyUserKey,
  USER_AGENT,
} from '@app/tel-core/tel-core.interface';
import { Context } from 'telegraf';

@Injectable()
export class TelUpdateService extends BaseLog {
  constructor(private readonly aiService: AIService) {
    super();
  }

  public handleMessage(message: string, userAgent: string): Promise<string> {
    return this.aiService.chat(message, AIModelName.gpt4oMini, userAgent);
  }

  public async getAPIKeyAI() {
    return this.aiService.getApiKey();
  }

  public async handleMessageWithTopic(
    message: string,
    sysDescription: string,
    userAgent: string,
    model: AIModeType = AIModelName.gpt4oMini,
  ) {
    return await this.aiService.askTopic(
      message,
      sysDescription,
      model,
      userAgent,
    );
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
      case MenuCommand.CACHING:
        await ctx.reply('Xin moi chon chuc nang', USER_AGENT(timestamp));
        break;
      default:
        await ctx.reply('Chưa hỗ trợ');
        break;
    }
  }
}
