import { Injectable } from '@nestjs/common';
import { BaseService } from '@app/storage/base.service';
import { IDataKey, REDIS_QUEUE_TYPE } from '@app/storage/storage.interface';

@Injectable()
export class StorageService extends BaseService {
  async addKeysToQueue(queueName: REDIS_QUEUE_TYPE, data: IDataKey[]) {
    for (const item of data) {
      await this.pushToQueue(queueName, item);
    }
  }
}
