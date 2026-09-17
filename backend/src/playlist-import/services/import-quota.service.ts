import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ImportQuotaDto } from '../dto/import-quota.dto';
import {
  IMPORT_DAILY_LIMIT,
  IMPORT_DAILY_TTL_SECONDS,
  REFRESH_COOLDOWN_SECONDS,
  importDailyKey,
  refreshCooldownKey,
} from '../consts';

/** Seconds until the next one is allowed, or null when it was allowed. */
export type Refusal = number | null;

@Injectable()
export class ImportQuotaService {
  constructor(private readonly redis: RedisService) {}

  async claimDay(userId: string): Promise<Refusal> {
    const client = this.redis.getClient();
    const key = importDailyKey(userId);
    const used = await client.incr(key);
    if (used === 1) {
      await client.expire(key, IMPORT_DAILY_TTL_SECONDS);
    }
    if (used <= IMPORT_DAILY_LIMIT) {
      return null;
    }
    await client.decr(key);
    const ttl = await client.ttl(key);
    return ttl > 0 ? ttl : IMPORT_DAILY_TTL_SECONDS;
  }

  /** For a read that never happened, so a bad link does not cost the player. */
  async refundDay(userId: string): Promise<void> {
    await this.redis.getClient().decr(importDailyKey(userId));
  }

  async claimRefresh(userId: string, trackGroupId: string): Promise<Refusal> {
    const client = this.redis.getClient();
    const key = refreshCooldownKey(userId, trackGroupId);
    const claimed = await client.set(
      key,
      '1',
      'EX',
      REFRESH_COOLDOWN_SECONDS,
      'NX',
    );
    if (claimed) {
      return null;
    }
    const ttl = await client.ttl(key);
    return ttl > 0 ? ttl : REFRESH_COOLDOWN_SECONDS;
  }

  async releaseRefresh(userId: string, trackGroupId: string): Promise<void> {
    await this.redis.getClient().del(refreshCooldownKey(userId, trackGroupId));
  }

  async dayLeft(userId: string): Promise<ImportQuotaDto> {
    const client = this.redis.getClient();
    const key = importDailyKey(userId);
    const [used, ttl] = await Promise.all([client.get(key), client.ttl(key)]);
    return {
      left: Math.max(0, IMPORT_DAILY_LIMIT - Number(used ?? 0)),
      limit: IMPORT_DAILY_LIMIT,
      resetsIn: ttl > 0 ? ttl : undefined,
    };
  }
}
