export enum BotCommand {
  INFO = 'Info',
  MENU = 'Menu',
  TOPIC = 'Topic',
  MODEL = 'Model',
  SETTING = 'Setting',
  RESTORE = 'Restore',
}

export enum MenuCommand {
  KEY = 'Setup Key',
  CACHING = 'Caching',
  DB = 'Database',
}

export enum TopicCommand {
  JAPANESE = 'Japanese',
  ENGLISH = 'English',
  CODING = 'Coding',
  ACCOUNTANT = 'Accountant',
  OTHER = 'Other',
  DRAW = 'Draw',
}

export enum KeyCommand {
  Add = 'Key Add',
  Remove = 'Key Remove',
  Restore = 'Key Reset',
}

export const CONFIRMATION_MENU = (T: string, date: number = Date.now()) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🆗 Yes', callback_data: `${date}_YES_${T}` },
        { text: '🚫 No', callback_data: `${date}_NO_${T}` },
      ],
    ],
  },
});

export type TYPE_MENU = (typeof MenuCommand)[keyof typeof MenuCommand];
export type TYPE_KEY = (typeof KeyCommand)[keyof typeof KeyCommand];
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
export const MENU_MENU = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: `🔑 ${MenuCommand.KEY}`, callback_data: `${MenuCommand.KEY}` },
        {
          text: `💾 ${MenuCommand.CACHING}`,
          callback_data: `${MenuCommand.CACHING}`,
        },
      ],
      [
        { text: `🗄️ ${MenuCommand.DB}`, callback_data: `${MenuCommand.DB}` },
        {
          text: `🔍 Cancel`,
          callback_data: `${BotCommand.MENU}`,
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

export interface IResponse<T> {
  msg: string;
  cmd: T;
}

export const ReplyUser = (
  username: string,
  topicName: TYPE_TOPIC,
): IResponse<TYPE_TOPIC> => {
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

export const ReplyUserKey = (
  username: string,
  keyName: TYPE_MENU,
): IResponse<TYPE_MENU> => {
  let text = '';
  switch (keyName) {
    case MenuCommand.KEY:
      text = `${username} muốn thay đổi key 🔑 nhỉ .`;
      break;
    case MenuCommand.CACHING:
      text = `${username} muốn thay đổi cách cache nhỉ.`;
      break;
    case MenuCommand.DB:
      text = `${username} muốn thay đổi cách lưu trữ nhỉ.`;
      break;
    default:
      text = `${username} quay trở lại nhé.`;
  }
  return {
    msg: text,
    cmd: keyName,
  };
};

interface CallbackData {
  timestamp: number;
  choice: 'YES' | 'NO';
  suffix: string;
}

export const regex = /^(\d{13})_(YES|NO)_(.*)$/i;
export const decodeCallbackData = (data: string): CallbackData | null => {
  const match = data.match(regex);
  if (!match) return null;
  const timestamp = parseInt(match[1], 10);
  if (isNaN(timestamp)) return null;

  return {
    timestamp,
    choice: match[2] as 'YES' | 'NO',
    suffix: match[3],
  };
};
