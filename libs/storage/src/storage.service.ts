import { Injectable } from '@nestjs/common';
import { BaseService } from '@app/storage/base.service';
import {
  AIML_KEY,
  AIML_MODEL,
  ASK_ACTIVE,
  IDataActive,
  IDataKey,
  KEY_CACHING,
  REDIS_QUEUE_NAME,
  REDIS_QUEUE_TYPE,
  SYS_DES_CACHING,
  USER_AGENT,
} from '@app/storage/storage.interface';
import { IUserTelegram } from '@app/tel-core';
import { AIModeType } from '@app/ai';

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

  async getUserAgent(user: IUserTelegram): Promise<string> {
    const result = await this.jsonGet(user.id.toString(), USER_AGENT);
    if (result?.success) {
      return typeof result.data === 'object' ? result.data.userAgent : '';
    } else {
      return '';
    }
  }

  async setUserAgent(user: IUserTelegram, userAgent: string) {
    return this.jsonSet(user.id.toString(), USER_AGENT, { userAgent });
  }

  async setKeyAIML(user: IUserTelegram, key: string) {
    return this.jsonSet(user.id.toString(), AIML_KEY, key);
  }

  async getKeyAIML(user: IUserTelegram) {
    const result = await this.jsonGet(user.id.toString(), AIML_KEY);
    if (result?.success) {
      return typeof result.data === 'string' ? result.data : '';
    } else {
      return '';
    }
  }

  async updateAIMLKey(
    user: IUserTelegram,
    key: string,
    force: boolean = false,
  ) {
    if (force) {
      const keyAIMLOld = await this.getKeyAIML(user);
      if (keyAIMLOld) {
        await this.blockApiKey(keyAIMLOld);
      }
      await this.setKeyAIML(user, key);
      return true;
    }
    const keyAIML = await this.getKeyAIML(user);
    if (!keyAIML) {
      await this.setKeyAIML(user, key);
      return true;
    }
    return false;
  }

  async setModelActive(user: IUserTelegram, modelName: AIModeType) {
    return this.jsonSet(user.id.toString(), AIML_MODEL, modelName);
  }

  async getModelActive(user: IUserTelegram) {
    const result = await this.jsonGet(user.id.toString(), AIML_MODEL);
    if (result?.success) {
      return typeof result.data === 'string' ? result.data : '';
    } else {
      return '';
    }
  }

  async updateModelActive(
    user: IUserTelegram,
    modelName: AIModeType,
    force: boolean = false,
  ) {
    if (force) {
      await this.setModelActive(user, modelName);
      return true;
    }
    const modelActive = await this.getModelActive(user);
    if (!modelActive) {
      await this.setModelActive(user, modelName);
      return true;
    }
    return false;
  }
}
