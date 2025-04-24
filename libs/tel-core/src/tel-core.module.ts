import { Module } from '@nestjs/common';
import { TelCoreService } from './tel-core.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelUpdateService } from '@app/tel-core/tel-update.service';

@Module({
  imports: [
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
            apiMode: 'bot',
            timeout: 10000,
          },
        },
      }),
    }),
  ],
  providers: [TelCoreService, TelUpdateService],
  exports: [TelCoreService, TelUpdateService],
})
export class TelCoreModule {}
