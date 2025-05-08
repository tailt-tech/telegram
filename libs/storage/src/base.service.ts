import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  IContentCaching,
  IDataKey,
  REDIS_QUEUE_NAME,
  REDIS_QUEUE_TYPE,
  ResponseRedis,
} from '@app/storage/storage.interface';

@Injectable()
export class BaseService {
  constructor(@Inject('REDIS_CACHING') private readonly redisCaching: Redis) {}

  async setCachingHash(key: string, hash: { key: string; value: string }) {
    try {
      await this.redisCaching.hset(key, hash.key, hash.value);
      return { success: true, message: `Hash set for key ${key}` };
    } catch (error) {
      throw new Error(`Failed to set hash in Redis: ${error}`);
    }
  }

  async jsonTopicGet(keyRoot: string): Promise<ResponseRedis> {
    try {
      const key = `user_topics:${keyRoot}`;
      const topicCaching = await this.redisCaching.zrange(key, 0, -1);
      if (topicCaching.length) {
        return {
          success: true,
          message: 'Đây là topic đã tạo',
          data: topicCaching.join(', '),
        };
      } else
        return {
          success: false,
          message: 'Không có topic được tạo',
          data: '',
        };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Không thể lấy dữ liệu từ Redis',
      };
    }
  }

  async jsonTopicSet(keyRoot: string, value: string): Promise<ResponseRedis> {
    try {
      const key = `user_topics:${keyRoot}`;
      const score = Date.now();
      await this.redisCaching.zadd(key, 'NX', score, value);
      return {
        message: 'JSON data set successfully',
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to set JSON data: ${error}`,
      };
    }
  }

  async jsonTopicDel(keyRoot: string, value: string): Promise<ResponseRedis> {
    try {
      const key = `user_topics:${keyRoot}`;
      await this.redisCaching.zrem(key, value);
      return {
        message: 'JSON data set successfully',
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to set JSON data: ${error}`,
      };
    }
  }

  async jsonSessionSet(
    keyRoot: string,
    topicName: string,
    value: IContentCaching,
    maxLength: number = 100,
  ): Promise<ResponseRedis> {
    try {
      const normalizedPath = topicName.replace(/^\.\//, '.');
      const key = `history:${keyRoot}:${normalizedPath}:${value.timestamp}`;
      const keyPattern = `history:${keyRoot}:${normalizedPath}:*`;
      if (normalizedPath !== '.') {
        const exists = await this.redisCaching.exists(key);
        if (!exists) {
          await this.redisCaching.call('JSON.SET', key, '.', '{}');
        }
      }
      await this.redisCaching.call('JSON.SET', key, '.', JSON.stringify(value));
      await this.redisCaching.expire(key, 3600);
      const keys = await this.redisCaching.keys(keyPattern);
      const length = keys.length;
      if (length > maxLength) {
        const keysToRemove = keys.slice(0, length - maxLength);
        if (keysToRemove.length > 0) {
          await this.redisCaching.del(keysToRemove);
        }
      }
      return {
        message: 'JSON data set successfully',
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to set JSON data: ${error}`,
      };
    }
  }

  async jsonSessionGet(
    keyRoot: string,
    topicName: string,
  ): Promise<ResponseRedis> {
    try {
      const normalizedPath = topicName.replace(/^\.\//, '.');
      const keyPattern = `history:${keyRoot}:${normalizedPath}:*`;
      const [keys] = await Promise.all([this.redisCaching.keys(keyPattern)]);
      if (!keys.length)
        return {
          success: false,
          message: 'Không tìm thấy session',
        };
      const messages: IContentCaching[] = await Promise.all(
        keys.map(async (key) => {
          const raw = await this.redisCaching.call('JSON.GET', key);
          return typeof raw === 'string'
            ? (JSON.parse(raw) as IContentCaching)
            : null;
        }),
      );
      if (!messages || !messages.length)
        return {
          success: true,
          message: 'Đây là session đã tạo',
          data: '',
        };
      const text = messages
        .filter((message) => message !== null)
        .map((message) => message.content)
        .join('\n');

      return {
        message: 'JSON data set successfully',
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: `Not found session with topic name ${topicName}`,
      };
    }
  }

  /*Redis Json Methods*/
  async jsonSet(
    keyRoot: string,
    path: string,
    value: Record<string, any> | string,
  ): Promise<ResponseRedis> {
    try {
      const normalizedPath = path.replace(/^\.\//, '.');
      const key = `topic_active:${keyRoot}`;
      if (normalizedPath !== '.') {
        const exists = await this.redisCaching.exists(key);
        if (!exists) {
          // Initialize with an  object at root
          await this.redisCaching.call('JSON.SET', key, '.', '{}');
        }
      }
      await this.redisCaching.call(
        'JSON.SET',
        key,
        normalizedPath,
        JSON.stringify(value),
      );
      return {
        message: 'JSON data set successfully',
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: 'Cannot set JSON data',
      };
    }
  }

  async jsonGet(keyRoot: string, path: string = ''): Promise<ResponseRedis> {
    const key = `topic_active:${keyRoot}`;
    if (!key)
      return {
        success: false,
        message: `Not found key`,
      };
    try {
      const result = await this.redisCaching.call('JSON.GET', key, path);
      if (!result)
        return {
          success: false,
          message: `No data found for key ${key}`,
        };
      if (typeof result !== 'string')
        return {
          success: false,
          message: `Expected a string value from JSON.SET, got ${typeof result} instead`,
        };
      const data = JSON.parse(result) as Record<string, any> | string;
      return {
        success: true,
        message: '',
        data,
      };
    } catch (e) {
      return {
        success: false,
        message: `Failed to get JSON data: ${e}`,
      };
    }
  }

  async getCaching(key: string): Promise<string> {
    return (await this.redisCaching.get(key)) ?? '';
  }

  async setCaching(key: string, value: string, ttl = 3600 * 24): Promise<void> {
    await this.redisCaching.set(key, value.trim(), 'EX', ttl);
  }

  async delCaching(key: string): Promise<void> {
    await this.redisCaching.del(key);
  }

  async pushToQueue(
    queueName: REDIS_QUEUE_TYPE,
    data: IDataKey,
    right: boolean = true,
  ) {
    const payload = JSON.stringify(data);
    if (right) await this.redisCaching.rpush(queueName, payload);
    else await this.redisCaching.lpush(queueName, payload);
  }

  async popFromQueue<T>(queueName: REDIS_QUEUE_TYPE): Promise<T | null> {
    const payload = await this.redisCaching.rpop(queueName);
    return payload ? (JSON.parse(payload) as T) : null;
  }

  async removeAllKeyInQueue(queueName: REDIS_QUEUE_TYPE) {
    await this.redisCaching.ltrim(queueName, 1, 0);
  }

  async hasValueInQueue(queueName: REDIS_QUEUE_TYPE) {
    return (await this.redisCaching.llen(queueName)) > 0;
  }

  async getAllKeysInQueue(queueName: REDIS_QUEUE_TYPE) {
    return this.redisCaching.lrange(queueName, 0, -1);
  }

  async blockApiKey(apiKey: string, code: number = 403) {
    const apiKeyLock: IDataKey = {
      startTime: Date.now(),
      codeStatus: code,
      value: apiKey,
    };
    await this.pushToQueue(REDIS_QUEUE_NAME.INACTIVE, apiKeyLock);
  }
}
