import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { REDIS_QUEUE_NAME } from '@app/storage/storage.interface';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class StorageService {
  constructor(
    @InjectQueue(REDIS_QUEUE_NAME.ACTIVE)
    private readonly activeQueue: Queue,
    @InjectQueue(REDIS_QUEUE_NAME.INACTIVE)
    private readonly inactiveQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
}
