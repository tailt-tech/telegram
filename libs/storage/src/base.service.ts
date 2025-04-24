import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { IDataKey, REDIS_QUEUE_TYPE } from '@app/storage/storage.interface';

@Injectable()
export class BaseService {
  constructor(@Inject('REDIS_CACHING') private readonly redisCaching: Redis) {}

  async getCaching(key: string): Promise<string> {
    return (await this.redisCaching.get(key)) ?? '';
  }

  async setCaching(key: string, value: string, ttl = 3600 * 24): Promise<void> {
    await this.redisCaching.set(key, value, 'EX', ttl);
  }

  async delCaching(key: string): Promise<void> {
    await this.redisCaching.del(key);
  }

  async pushToQueue(queueName: REDIS_QUEUE_TYPE, data: IDataKey) {
    const payload = JSON.stringify(data);
    await this.redisCaching.rpush(queueName, payload);
  }

  async popFromQueue<T>(queueName: REDIS_QUEUE_TYPE): Promise<T | null> {
    const payload = await this.redisCaching.rpop(queueName);
    return payload ? (JSON.parse(payload) as T) : null;
  }
}
