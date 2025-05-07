import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  IDataKey,
  REDIS_QUEUE_TYPE,
  ResponseRedis,
} from '@app/storage/storage.interface';

@Injectable()
export class BaseService {
  constructor(@Inject('REDIS_CACHING') private readonly redisCaching: Redis) {
  }

  async setCachingHash(key: string, hash: { key: string; value: string }) {
    try {
      await this.redisCaching.hset(key, hash.key, hash.value);
      return { success: true, message: `Hash set for key ${key}` };
    } catch (error) {
      throw new Error(`Failed to set hash in Redis: ${error}`);
    }
  }

  async getCachingHash(key: string, hashKey: string) {
    return this.redisCaching.hget(key, hashKey);
  }

  async setCachingHashJson(
    key: string,
    hash: Record<string, string>,
  ): Promise<ResponseRedis> {
    try {
      await this.redisCaching.hmset(key, hash);
      return { success: true, message: `Hash set for key ${key}` };
    } catch (error) {
      throw new Error(`Failed to set hash in Redis: ${error}`);
    }
  }

  async getCachingHashJson(key: string): Promise<Record<string, string>> {
    return this.redisCaching.hgetall(key);
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
      const data = JSON.parse(result) as Record<string, any>;
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
}
