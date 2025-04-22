import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BaseService } from '@app/shared-utils/base.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AIML_API_KEY: Joi.string()
          .required()
          .pattern(/^[\w\s,]+$/)
          .label('AIML_API_KEY'),
        AIML_API_URL: Joi.string().uri().required(),
        TELEGRAM_BOT_TOKEN: Joi.string().required(),
      }),
    }),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    BaseService,
    {
      provide: 'AIML_API_KEY',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('AIML_API_KEY'),
      inject: [ConfigService],
    },
    {
      provide: 'AIML_API_URL',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('AIML_API_URL'),
      inject: [ConfigService],
    },
  ],
  exports: [HttpModule, BaseService],
})
export class BaseModule {}
