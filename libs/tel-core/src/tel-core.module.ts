import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIModule } from '@app/ai';
import { session } from 'telegraf';
import { TelCoreService } from '@app/tel-core/tel-core.service';
import { TelUpdateService } from '@app/tel-core/tel-update.service';
import { CoreModule } from '@app/shared-utils/core.module';

@Module({
  imports: [
    AIModule,
    CoreModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN', ''),
        middlewares: [session()],
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
