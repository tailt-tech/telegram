import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { BaseLog } from '@app/shared-utils/base.log';
import pRetry from 'p-retry';
import { ResponseBase } from '@app/ai';
import { StorageService } from '@app/storage';

@Injectable()
export class BaseService extends BaseLog {
  protected apiURL: string;
  protected apiKeys: string[];

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    protected readonly storageService: StorageService,
  ) {
    super();
    this.apiURL = this.configService.get<string>('AIML_API_URL', '').trim();
    this.apiKeys = this.configService
      .get<string>('AIML_API_KEY', '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
  }

  private getRandomApiKey(): string {
    if (this.apiKeys.length === 0) {
      throw new Error('No API keys provided');
    }
    const index = Math.floor(Math.random() * this.apiKeys.length);
    return this.apiKeys[index];
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
      const response = await pRetry(
        async (attempt: number) => {
          const apiKey = this.getRandomApiKey();
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
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
          if (dataResp.status !== 200 && dataResp.status !== 201) {
            throw new Error(`HTTP error! status: ${dataResp.status}`);
          }
          return dataResp;
        },
        {
          retries: 5,
          minTimeout: 1000,
          maxTimeout: 5000,
          onFailedAttempt: (error) => {
            this.logger.error(
              `Attempt ${error.attemptNumber} failed: ${error.message}`,
            );
          },
        },
      );
      this.logger.log(`POST ${this.apiURL + url} successful`);
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
