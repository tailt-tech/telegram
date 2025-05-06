export enum REDIS_QUEUE_NAME {
  ACTIVE = 'QUEUE_ACTIVE',
  INACTIVE = 'QUEUE_INACTIVE',
}

export const KEY_CACHING = 'keyCaching';
export const SYS_DES_CACHING = '';
export const ASK_ACTIVE = 'askActive';
export const USER_AGENT = 'userAgent';
export type REDIS_QUEUE_TYPE =
  (typeof REDIS_QUEUE_NAME)[keyof typeof REDIS_QUEUE_NAME];

export interface IDataKey {
  value: string;
  codeStatus: number;
  startTime: number;
}

export interface IDataActive {
  key: string;
  value: string;
}

export interface ResponseRedis<T = Record<string, string>> {
  success: boolean;
  message: string;
  data?: T;
}
