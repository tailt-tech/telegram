export enum REDIS_QUEUE_NAME {
  ACTIVE = 'QUEUE_ACTIVE',
  INACTIVE = 'QUEUE_INACTIVE',
}
export const KEY_CACHING = 'keyCaching';
export const SYS_DES_CACHING = '';
export type REDIS_QUEUE_TYPE =
  (typeof REDIS_QUEUE_NAME)[keyof typeof REDIS_QUEUE_NAME];

export interface IDataKey {
  value: string;
  codeStatus: number;
  startTime: number;
}
