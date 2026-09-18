import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Push onto a capped list, newest first, in one round trip. The trim is what
   * makes it a ring buffer: without it the key grows for as long as it lives.
   */
  async pushCapped(
    key: string,
    value: string,
    size: number,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client
      .multi()
      .lpush(key, value)
      .ltrim(key, 0, size - 1)
      .expire(key, ttlSeconds)
      .exec();
  }

  /** Returns the value after the increment, so a caller can act on the count. */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const [count] = (await this.client
      .multi()
      .incr(key)
      .expire(key, ttlSeconds)
      .exec()) as [[Error | null, number], ...unknown[]];
    return count[1];
  }

  /** The whole list, oldest first, which is the order a reader wants it in. */
  async listOldestFirst(key: string): Promise<string[]> {
    const values = await this.client.lrange(key, 0, -1);
    return values.reverse();
  }

  /** Expose the underlying ioredis client (used by throttler storage adapter) */
  getClient(): Redis {
    return this.client;
  }
}
