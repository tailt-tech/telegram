import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { BaseLog } from '@app/shared-utils/base.log';
import pRetry, { AbortError } from 'p-retry';
import { ResponseBase } from '@app/ai';
import {
  IDataKey,
  KEY_CACHING,
  REDIS_QUEUE_NAME,
  StorageService,
} from '@app/storage';

@Injectable()
export class BaseService extends BaseLog {
  public static readonly KEY_CACHING = 'keyCaching';
  protected apiURL: string;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    protected readonly storageService: StorageService,
  ) {
    super();
    this.apiURL = this.configService.get<string>('AIML_API_URL', '').trim();
  }

  private async getApiKey() {
    let apiKey = await this.storageService.getCaching(KEY_CACHING);
    if (!apiKey) {
      const data = await this.storageService.popFromQueue<IDataKey>(
        REDIS_QUEUE_NAME.ACTIVE,
      );
      apiKey = data?.value ?? '';
      if (!apiKey) {
        return '';
      }
      await this.setApiKey(apiKey);
    }
    return apiKey;
  }

  private async setApiKey(apiKey: string) {
    await this.storageService.setCaching(KEY_CACHING, apiKey);
  }

  private async blockApiKey(apiKey: string) {
    const apiKeyLock: IDataKey = {
      startTime: Date.now(),
      codeStatus: 403,
      value: apiKey,
    };
    await this.storageService.pushToQueue(
      REDIS_QUEUE_NAME.INACTIVE,
      apiKeyLock,
    );
  }

  async postExternalData<T>(
    url: string,
    body: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<ResponseBase<T>> {
    const resp: ResponseBase<T> = {
      statusCode: 200,
      data: null,
      msg: 'Success',
    };
    try {
      let apiKeyUsing = '';
      const response = await pRetry(
        async () => {
          apiKeyUsing = await this.getApiKey();
          if (!apiKeyUsing) {
            throw new AbortError('No has key active');
          }
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKeyUsing}`,
            ...extraHeaders,
          };
          this.logger.debug(
            `POST ${this.apiURL + url} with headers: ${JSON.stringify(headers)} and body: ${JSON.stringify(body)}`,
          );
          const observable = this.httpService.post<T>(this.apiURL + url, body, {
            headers,
            timeout: 10000,
          });
          const dataResp = await lastValueFrom(observable);
          if (dataResp.status === 403) {
            await this.storageService.delCaching(apiKeyUsing);
            await this.blockApiKey(apiKeyUsing);
          }
          if (dataResp.status !== 200 && dataResp.status !== 201) {
            throw new Error(`HTTP error! status: ${dataResp.status}`, {
              cause: dataResp.status,
            });
          }
          return dataResp;
        },
        {
          retries: 5,
          minTimeout: 1000,
          maxTimeout: 5000,
          onFailedAttempt: async (error) => {
            this.logger.error(
              `Attempt ${error.attemptNumber} failed: ${error.message}`,
            );
            if (!error.retriesLeft) {
              await this.blockApiKey(apiKeyUsing);
              this.logger.warn(`The key ${apiKeyUsing} is blocked`);
            }
          },
        },
      );
      resp.statusCode = response.status;
      resp.data = response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to POST ${this.apiURL + url}: ${errorMessage}`,
        error,
      );
      resp.statusCode = 500;
      resp.msg = errorMessage;
    }
    return resp;
  }
}
