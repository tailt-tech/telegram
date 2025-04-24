import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    StorageService,
    {
      provide: 'REDIS_CACHING',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USERNAME'),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
