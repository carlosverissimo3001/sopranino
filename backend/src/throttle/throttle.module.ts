import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisService } from '@redis/redis.service';
import { RedisModule } from '@redis/redis.module';
import {
  THROTTLE_AVATAR,
  THROTTLE_DEMO,
  THROTTLE_GUESS,
  THROTTLE_SEARCH,
  THROTTLE_TTL,
  THROTTLE_START,
  THROTTLE_CREDENTIALS,
  THROTTLE_DEFAULT_LIMIT,
  THROTTLE_FEEDBACK,
  THROTTLE_IMPORT,
} from './throttle.constants';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: THROTTLE_GUESS,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_SEARCH,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_DEMO,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_START,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_CREDENTIALS,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_FEEDBACK,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_IMPORT,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
          {
            name: THROTTLE_AVATAR,
            ttl: THROTTLE_TTL,
            limit: THROTTLE_DEFAULT_LIMIT,
          },
        ],
        storage: new ThrottlerStorageRedisService(redisService.getClient()),
      }),
    }),
  ],
})
export class ThrottleModule {}
