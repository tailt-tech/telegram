import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  public static method: 'socks5' | 'http' = 'socks5';
  constructor(private readonly configService: ConfigService) {}

  getProxyAgent() {
    return {
      host: this.configService.get<string>('PROXY_HOST'),
      port: this.configService.get<number>('PROXY_PORT'),
      username: this.configService.get<string>('PROXY_USERNAME'),
      password: this.configService.get<string>('PROXY_PASSWORD'),
    };
  }
  getProxyAgentString(method: 'socks5' | 'http' = ProxyService.method): string {
    return `${method}://${this.getProxyAgent().username}:${this.getProxyAgent().password}@${this.getProxyAgent().host}:${this.getProxyAgent().port}`;
  }
}
