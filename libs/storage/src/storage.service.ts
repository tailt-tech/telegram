import { Injectable } from '@nestjs/common';
import { BaseService } from '@app/storage/base.service';
import {
  ASK_ACTIVE,
  IDataActive,
  IDataKey,
  KEY_CACHING,
  REDIS_QUEUE_NAME,
  REDIS_QUEUE_TYPE,
  SYS_DES_CACHING,
} from '@app/storage/storage.interface';

@Injectable()
export class StorageService extends BaseService {
  async addKeysToQueue(queueName: REDIS_QUEUE_TYPE, data: IDataKey[]) {
    for (const item of data) {
      await this.pushToQueue(queueName, item);
    }
  }
  async hasKeysActiveList() {
    return this.hasValueInQueue(REDIS_QUEUE_NAME.ACTIVE);
  }
  async setSysDescriptionCaching(
    payload: { key: string; value: string },
    nameCaching = SYS_DES_CACHING,
  ) {
    return this.setCachingHash(nameCaching, payload);
  }
  async restoreCaching(nameCaching: string = KEY_CACHING) {
    const key = await this.getCaching(nameCaching);
    const data: IDataKey = {
      codeStatus: 422,
      startTime: Date.now(),
      value: key,
    };
    if (!key) await this.pushToQueue(REDIS_QUEUE_NAME.ACTIVE, data, false);
    await this.delCaching(nameCaching);
  }

  async setTopicActive(userId: number, payload: IDataActive) {
    return this.jsonSet(userId.toString(), ASK_ACTIVE, payload);
  }
  async getTopicActive(userId: number) {
    return await this.jsonGet(userId.toString(), ASK_ACTIVE);
  }
}
