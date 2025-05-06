import { Module } from '@nestjs/common';
import { BaseService } from '@app/shared-utils/base.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { CoreModule } from '@app/shared-utils/core.module';
import { ProxyService } from '@app/shared-utils/proxy.service';

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AIML_API_URL: Joi.string().uri().required(),
        TELEGRAM_BOT_TOKEN: Joi.string().required(),
        PROXY_HOST: Joi.string().hostname().required(), // e.g., 192.168.0.1 or proxy.example.com
        PROXY_PORT: Joi.number().port().required(), // e.g., 8080
        PROXY_USERNAME: Joi.string().optional(), // optional if using basic auth
        PROXY_PASSWORD: Joi.string().optional(),
      }),
    }),
  ],
  providers: [
    BaseService,
    {
      provide: 'AIML_API_URL',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('AIML_API_URL'),
      inject: [ConfigService],
    },
    ProxyService,
  ],
  exports: [CoreModule, BaseService, ProxyService],
})
export class BaseModule {}
