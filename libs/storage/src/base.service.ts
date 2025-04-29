import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { IDataKey, REDIS_QUEUE_TYPE } from '@app/storage/storage.interface';

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

  async getCachingHash(key: string, hashKey: string) {
    try {
      return await this.redisCaching.hget(key, hashKey);
    } catch (error) {
      return null;
    }
  }

  async getCaching(key: string): Promise<string> {
    return (await this.redisCaching.get(key)) ?? '';
  }

  async setCaching(key: string, value: string, ttl = 3600 * 24): Promise<void> {
    await this.redisCaching.set(key, value, 'EX', ttl);
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
}
