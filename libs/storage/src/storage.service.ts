import { Injectable } from '@nestjs/common';
import { BaseService } from '@app/storage/base.service';
import {
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

  async getCachingOrSave(nameCaching: string = KEY_CACHING) {
    const key = await this.getCaching(nameCaching);
    if (!key) return await this.popFromQueue(REDIS_QUEUE_NAME.ACTIVE);
    return key;
  }

  async getSysDescriptionCaching(
    topicName: string,
    key: string = SYS_DES_CACHING,
  ) {
    return this.getCachingHash(key, topicName);
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
}
