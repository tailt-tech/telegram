import { Module } from '@nestjs/common';
import { BaseService } from '@app/shared-utils/base.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { CoreModule } from '@app/shared-utils/core.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AIML_API_URL: Joi.string().uri().required(),
        TELEGRAM_BOT_TOKEN: Joi.string().required(),
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
  ],
  exports: [CoreModule, BaseService],
})
export class BaseModule {}
