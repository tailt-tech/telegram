import { Module } from '@nestjs/common';
import { TelBotService } from './tel-bot.service';
import { TelCoreModule } from '@app/tel-core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelBotUpdate } from './tel-bot.update';

@Module({
  imports: [
    TelCoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN', ''),
        options: {
          telegram: {
            apiRoot: 'https://api.telegram.org',
          },
        },
      }),
    }),
  ],
  providers: [TelBotService, TelBotUpdate],
  exports: [TelBotService],
})
export class TelBotModule {}
