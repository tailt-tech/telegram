import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { REDIS_QUEUE_NAME } from '@app/storage/storage.interface';
import { createCache } from 'cache-manager';
import KeyvRedis from '@keyv/redis';
import { CacheableMemory, Keyv } from 'cacheable';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const redisOptions = {
          url: redisUrl,
          password: configService.get<string>('REDIS_PASSWORD')!,
        };
        const keyvRedis = new KeyvRedis(redisOptions);
        const keyv = new Keyv({ store: keyvRedis });
        const redisCache = createCache(keyv);
        const memoryCache = createCache(
          new Keyv({
            store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
          }),
        );
        return {
          isGlobal: true,
          store: () => memoryCache,
          fallbackStore: () => redisCache,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          username: configService.get('REDIS_USERNAME'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: REDIS_QUEUE_NAME.ACTIVE,
    }),
    BullModule.registerQueue({
      name: REDIS_QUEUE_NAME.INACTIVE,
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
