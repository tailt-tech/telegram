import { HttpException, Injectable } from '@nestjs/common';
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
import { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ProxyService } from '@app/shared-utils/proxy.service';
import { IUserTelegram } from '@app/tel-core';

@Injectable()
export class BaseService extends BaseLog {
  protected apiURL: string;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    protected readonly storageService: StorageService,
    protected readonly proxyService: ProxyService,
  ) {
    super();
    this.apiURL = this.configService.get<string>('AIML_API_URL', '').trim();
  }

  public async getApiKey() {
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
    return apiKey.trim();
  }

  private async setApiKey(apiKey: string) {
    await this.storageService.setCaching(KEY_CACHING, apiKey);
  }

  private async blockApiKey(apiKey: string, code: number = 403) {
    const apiKeyLock: IDataKey = {
      startTime: Date.now(),
      codeStatus: code,
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
        this.randomAPIKey<T>(url, body, extraHeaders, (key) => {
          apiKeyUsing = key;
        }),
        {
          retries: 2,
          minTimeout: 1000,
          maxTimeout: 15000,
          onFailedAttempt: async (error) => {
            const status = (error?.cause as number) ?? 500;
            this.logger.error(
              `Attempt ${error.attemptNumber} failed: ${error.message}`,
            );
            if (status === 403) {
              await this.storageService.restoreCaching();
            }
            if (!error.retriesLeft) {
              await this.blockApiKey(apiKeyUsing, 422);
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

  private randomAPIKey<T>(
    url: string,
    body: any,
    extraHeaders: Record<string, string>,
    onKeyAssigned?: (key: string) => void,
  ) {
    return async () => {
      const apiKeyUsing = await this.getApiKey();
      if (!apiKeyUsing) {
        throw new AbortError('No has key active');
      }
      onKeyAssigned?.(apiKeyUsing);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeyUsing}`,
        ...extraHeaders,
      };
      // Webshare proxy configuration
      const proxyUrl = this.proxyService.getProxyAgentString();
      const agent = new HttpsProxyAgent(proxyUrl);
      try {
        const observable = this.httpService.post<T>(this.apiURL + url, body, {
          headers,
          httpsAgent: agent,
          timeout: 20000,
        });
        this.logger.debug(`Post data with ${apiKeyUsing}`);
        return await lastValueFrom(observable);
      } catch (err: unknown) {
        this.logger.debug(err);
        const axiosError = err as AxiosError;
        const status = axiosError.status ?? 500;
        const message = 'Forbidden';
        const description = axiosError?.message || 'Unknown error';
        throw new HttpException(message, status, {
          cause: status,
          description,
        });
      }
    };
  }
}
