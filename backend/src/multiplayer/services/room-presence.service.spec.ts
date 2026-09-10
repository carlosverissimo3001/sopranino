import { Test } from '@nestjs/testing';
import { RedisService } from '../../redis/redis.service';
import { RoomPresenceService } from './room-presence.service';
import { ROOM_PRESENCE_STALE_MS } from '../../consts';

/**
 * An in-memory stand-in for the handful of Redis commands presence uses. Real
 * Redis is not available in unit tests, and what matters here is the eviction
 * and claim logic, not ioredis itself.
 */
class FakeRedis {
  hashes = new Map<string, Map<string, string>>();
  zset = new Map<string, Map<string, number>>();
  expiries = new Map<string, number>();

  private hash(key: string) {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    return this.hashes.get(key)!;
  }

  private sorted(key: string) {
    if (!this.zset.has(key)) this.zset.set(key, new Map());
    return this.zset.get(key)!;
  }

  hset(key: string, field: string, value: string) {
    this.hash(key).set(field, value);
    return Promise.resolve(1);
  }

  hdel(key: string, ...fields: string[]) {
    let removed = 0;
    for (const field of fields) {
      if (this.hash(key).delete(field)) removed++;
    }
    return Promise.resolve(removed);
  }

  hgetall(key: string) {
    return Promise.resolve(Object.fromEntries(this.hash(key)));
  }

  expire(key: string, seconds: number) {
    this.expiries.set(key, seconds);
    return Promise.resolve(1);
  }

  zadd(key: string, score: number, member: string) {
    this.sorted(key).set(member, score);
    return Promise.resolve(1);
  }

  zrem(key: string, member: string) {
    return Promise.resolve(this.sorted(key).delete(member) ? 1 : 0);
  }

  zrangebyscore(key: string, _min: string, max: number) {
    return Promise.resolve(
      [...this.sorted(key).entries()]
        .filter(([, score]) => score <= max)
        .map(([member]) => member),
    );
  }

  strings = new Map<string, string>();

  set(key: string, value: string, ...args: unknown[]) {
    if (args.includes('NX') && this.strings.has(key)) {
      return Promise.resolve(null);
    }
    this.strings.set(key, value);
    return Promise.resolve('OK');
  }

  setex(key: string, _ttl: number, value: string) {
    return this.set(key, value);
  }

  del(key: string) {
    return Promise.resolve(this.strings.delete(key) ? 1 : 0);
  }

  multi() {
    const queued: Array<() => Promise<unknown>> = [];
    const chain = {
      hset: (key: string, field: string, value: string) => {
        queued.push(() => this.hset(key, field, value));
        return chain;
      },
      expire: (key: string, seconds: number) => {
        queued.push(() => this.expire(key, seconds));
        return chain;
      },
      exec: async () => {
        for (const run of queued) await run();
        return [];
      },
    };
    return chain;
  }
}

describe('RoomPresenceService', () => {
  let service: RoomPresenceService;
  let redis: FakeRedis;

  beforeEach(async () => {
    redis = new FakeRedis();

    const module = await Test.createTestingModule({
      providers: [
        RoomPresenceService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => redis,
            set: (key: string, value: string) => redis.set(key, value),
            del: (key: string) => redis.del(key),
          },
        },
      ],
    }).compile();

    service = module.get(RoomPresenceService);
  });

  describe('presence', () => {
    it('reports a member who has just joined as online', async () => {
      await service.join('room-1', 'user-1');

      await expect(service.onlineUserIds('room-1')).resolves.toEqual([
        'user-1',
      ]);
    });

    it('gives the presence key a TTL so a dead instance cannot strand it', async () => {
      await service.join('room-1', 'user-1');

      expect(redis.expiries.get('room:presence:room-1')).toBeGreaterThan(0);
    });

    it('drops a member whose heartbeat has lapsed', async () => {
      await service.join('room-1', 'stale-user');
      await service.join('room-1', 'live-user');

      // Only the stale member is pushed outside the window.
      redis.hashes
        .get('room:presence:room-1')!
        .set('stale-user', String(Date.now() - ROOM_PRESENCE_STALE_MS - 1_000));

      await expect(service.onlineUserIds('room-1')).resolves.toEqual([
        'live-user',
      ]);
    });

    it('evicts the lapsed member rather than filtering it on every read', async () => {
      await service.join('room-1', 'stale-user');
      redis.hashes
        .get('room:presence:room-1')!
        .set('stale-user', String(Date.now() - ROOM_PRESENCE_STALE_MS - 1_000));

      await service.onlineUserIds('room-1');

      expect(redis.hashes.get('room:presence:room-1')!.has('stale-user')).toBe(
        false,
      );
    });

    it('refreshes an existing member instead of duplicating them', async () => {
      await service.join('room-1', 'user-1');
      await service.join('room-1', 'user-1');

      await expect(service.onlineUserIds('room-1')).resolves.toEqual([
        'user-1',
      ]);
    });

    it('removes a member who leaves', async () => {
      await service.join('room-1', 'user-1');
      await service.leave('room-1', 'user-1');

      await expect(service.onlineUserIds('room-1')).resolves.toEqual([]);
    });
  });

  describe('host grace', () => {
    it('does not claim a grace period that has not elapsed', async () => {
      await service.startHostGrace('room-1', Date.now() + 60_000);

      await expect(service.claimLapsedHostGraces()).resolves.toEqual([]);
    });

    it('claims a grace period once it has elapsed', async () => {
      await service.startHostGrace('room-1', Date.now() - 1);

      await expect(service.claimLapsedHostGraces()).resolves.toEqual([
        'room-1',
      ]);
    });

    it('claims each room only once, so one instance announces it', async () => {
      await service.startHostGrace('room-1', Date.now() - 1);

      await service.claimLapsedHostGraces();

      await expect(service.claimLapsedHostGraces()).resolves.toEqual([]);
    });

    it('reports a cancelled grace period so the host reconnect is announced', async () => {
      await service.startHostGrace('room-1', Date.now() + 60_000);

      await expect(service.cancelHostGrace('room-1')).resolves.toBe(true);
    });

    it('reports nothing to cancel when no grace period was pending', async () => {
      await expect(service.cancelHostGrace('room-1')).resolves.toBe(false);
    });

    it('remembers an announcement so a late-returning host is taken back', async () => {
      await service.startHostGrace('room-1', Date.now() - 1);
      await service.claimLapsedHostGraces();
      await service.markHostAnnounced('room-1');

      await expect(service.clearHostAnnounced('room-1')).resolves.toBe(true);
    });

    it('reports nothing to take back when no announcement was made', async () => {
      await expect(service.clearHostAnnounced('room-1')).resolves.toBe(false);
    });

    it('does not announce a host who reconnected inside the grace period', async () => {
      await service.startHostGrace('room-1', Date.now() - 1);
      await service.cancelHostGrace('room-1');

      await expect(service.claimLapsedHostGraces()).resolves.toEqual([]);
    });
  });

  describe('claimFirstSolve', () => {
    it('gives the round to whoever gets there first', async () => {
      await expect(service.claimFirstSolve('room', 0, 'alice')).resolves.toBe(
        true,
      );
      await expect(service.claimFirstSolve('room', 0, 'bob')).resolves.toBe(
        false,
      );
    });

    // The point of the claim: a read-then-write would let both through.
    it('picks one winner out of twenty finishing at once', async () => {
      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          service.claimFirstSolve('room', 3, `player-${i}`),
        ),
      );

      expect(results.filter(Boolean)).toHaveLength(1);
    });

    it('claims each round separately', async () => {
      await service.claimFirstSolve('room', 0, 'alice');

      await expect(service.claimFirstSolve('room', 1, 'bob')).resolves.toBe(
        true,
      );
    });

    it('claims each room separately', async () => {
      await service.claimFirstSolve('room-a', 0, 'alice');

      await expect(service.claimFirstSolve('room-b', 0, 'bob')).resolves.toBe(
        true,
      );
    });
  });
});
