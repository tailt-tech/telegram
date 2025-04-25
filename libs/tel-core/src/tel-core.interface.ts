export enum BotCommand {
  INFO = 'Info',
  MENU = 'Menu',
  TOPIC = 'Topic',
  MODEL = 'Model',
  SETTING = 'Setting',
  RESTORE = 'Restore',
}

export enum TopicCommand {
  JAPANESE = 'Japanese',
  ENGLISH = 'English',
  CODING = 'Coding',
  ACCOUNTANT = 'Accountant',
  OTHER = 'Other',
  DRAW = 'Draw',
}

export type TYPE_TOPIC = (typeof TopicCommand)[keyof typeof TopicCommand];

export const MENU_REPLY = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: `ℹ️ ${BotCommand.INFO}`, callback_data: `${BotCommand.INFO}` },
        { text: `📋 ${BotCommand.MENU}`, callback_data: `${BotCommand.MENU}` },
      ],
      [
        {
          text: `💬️ ${BotCommand.TOPIC}`,
          callback_data: `${BotCommand.TOPIC}`,
        },
        {
          text: `️️️️️️⛅ ${BotCommand.MODEL}`,
          callback_data: `${BotCommand.MODEL}`,
        },
      ],
      [
        {
          text: `️️️⚙️ ${BotCommand.SETTING}`,
          callback_data: `${BotCommand.SETTING}`,
        },
        {
          text: `🏭 ${BotCommand.RESTORE}`,
          callback_data: `${BotCommand.RESTORE}`,
        },
      ],
    ],
  },
};

export const MENU_TOPIC = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🇯🇵 Japanese', callback_data: TopicCommand.JAPANESE },
        { text: '🇺🇸 English', callback_data: TopicCommand.ENGLISH },
      ],
      [
        { text: '💻 Coding', callback_data: TopicCommand.CODING },
        { text: '📊 Accountant', callback_data: TopicCommand.ACCOUNTANT },
      ],
      [
        { text: '🎲 Other', callback_data: TopicCommand.OTHER },
        { text: '🎨 Draw', callback_data: TopicCommand.DRAW },
      ],
    ],
  },
};

export interface IResponseTopic {
  msg: string;
  cmd: TYPE_TOPIC;
}
export const ReplyUser = (
  username: string,
  topicName: TYPE_TOPIC,
): IResponseTopic => {
  let text = '';
  switch (topicName) {
    case TopicCommand.JAPANESE:
    case TopicCommand.ENGLISH:
      text = `${username} muốn học ngôn ngữ ${topicName} nhỉ. Tôi tin sẽ giúp được bạn.`;
      break;
    case TopicCommand.CODING:
    case TopicCommand.ACCOUNTANT:
      text = `${username} ơi, Tôi tin rằng với năng lực ${topicName} thì bạn chỉ tham khảo thôi nhé.`;
      break;
    case TopicCommand.DRAW:
      text = `${username} có tin tôi vẽ đẹp hơn bạn đấy.`;
      break;
    default:
      text = `${username} thử ai có khả năng giỏi hơn nhé.`;
  }
  return {
    msg: text,
    cmd: topicName,
  };
};
