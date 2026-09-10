import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import {
  ROOM_PLAYER_GONE_KEY,
  ROOM_HOST_ANNOUNCED_PREFIX,
  ROOM_HOST_ANNOUNCED_TTL,
  ROOM_HOST_GONE_KEY,
  ROOM_PRESENCE_PREFIX,
  ROOM_PRESENCE_STALE_MS,
  ROOM_PRESENCE_TTL,
  ROOM_FIRST_SOLVE_PREFIX,
  ROOM_FIRST_SOLVE_TTL,
} from '../../consts';

/**
 * Room membership and the pending host-disconnect deadline, both in Redis.
 *
 * Presence is a hash of userId -> last heartbeat, not a set, so a member whose
 * instance died lapses on their own once the heartbeats stop. A set would keep
 * them in the room forever: nothing would be left to remove them.
 */
@Injectable()
export class RoomPresenceService {
  constructor(private readonly redis: RedisService) {}

  private presenceKey(roomId: string): string {
    return `${ROOM_PRESENCE_PREFIX}${roomId}`;
  }

  /**
   * True for the first correct answer in a round and false for everyone after.
   * NX is the claim: a read-then-write would let two players who finished in
   * the same millisecond both believe they were first.
   */
  async claimFirstSolve(
    roomId: string,
    roundIndex: number,
    userId: string,
  ): Promise<boolean> {
    const claimed = await this.redis
      .getClient()
      .set(
        `${ROOM_FIRST_SOLVE_PREFIX}${roomId}:${roundIndex}`,
        userId,
        'EX',
        ROOM_FIRST_SOLVE_TTL,
        'NX',
      );

    return claimed === 'OK';
  }

  /** Records the member as online now; also refreshes an existing heartbeat. */
  async join(roomId: string, userId: string): Promise<void> {
    const client = this.redis.getClient();
    const key = this.presenceKey(roomId);

    await client
      .multi()
      .hset(key, userId, Date.now().toString())
      .expire(key, ROOM_PRESENCE_TTL)
      .exec();
  }

  async leave(roomId: string, userId: string): Promise<void> {
    await this.redis.getClient().hdel(this.presenceKey(roomId), userId);
  }

  /**
   * Online members, evicting any whose heartbeat has lapsed. The eviction is
   * lazy on purpose: a reader is the only thing guaranteed to still be running
   * after the instance that owned a stale member is gone.
   */
  async onlineUserIds(roomId: string): Promise<string[]> {
    const client = this.redis.getClient();
    const key = this.presenceKey(roomId);
    const entries = await client.hgetall(key);

    const cutoff = Date.now() - ROOM_PRESENCE_STALE_MS;
    const online: string[] = [];
    const stale: string[] = [];

    for (const [userId, lastSeen] of Object.entries(entries)) {
      if (Number(lastSeen) >= cutoff) {
        online.push(userId);
      } else {
        stale.push(userId);
      }
    }

    if (stale.length) {
      await client.hdel(key, ...stale);
    }

    return online;
  }

  private hostAnnouncedKey(roomId: string): string {
    return `${ROOM_HOST_ANNOUNCED_PREFIX}${roomId}`;
  }

  /** Marks the host as gone from `deadline` onwards, for the sweep to pick up. */
  async startHostGrace(roomId: string, deadlineMs: number): Promise<void> {
    await this.redis.getClient().zadd(ROOM_HOST_GONE_KEY, deadlineMs, roomId);
  }

  /** True when a countdown was actually pending, so the caller can announce it. */
  async cancelHostGrace(roomId: string): Promise<boolean> {
    const removed = await this.redis
      .getClient()
      .zrem(ROOM_HOST_GONE_KEY, roomId);
    return removed > 0;
  }

  /** Records that the room has been told, so the return trip is announced too. */
  async markHostAnnounced(roomId: string): Promise<void> {
    await this.redis.set(
      this.hostAnnouncedKey(roomId),
      '1',
      ROOM_HOST_ANNOUNCED_TTL,
    );
  }

  /** True when the room had been told its host was gone. */
  async clearHostAnnounced(roomId: string): Promise<boolean> {
    const removed = await this.redis
      .getClient()
      .del(this.hostAnnouncedKey(roomId));
    return removed > 0;
  }

  private seatMember(roomId: string, userId: string): string {
    return `${roomId}:${userId}`;
  }

  /** Starts the countdown on a seat the player has walked away from. */
  async startPlayerGrace(
    roomId: string,
    userId: string,
    deadlineMs: number,
  ): Promise<void> {
    await this.redis
      .getClient()
      .zadd(ROOM_PLAYER_GONE_KEY, deadlineMs, this.seatMember(roomId, userId));
  }

  /** They came back inside the window, so the seat is theirs again. */
  async cancelPlayerGrace(roomId: string, userId: string): Promise<void> {
    await this.redis
      .getClient()
      .zrem(ROOM_PLAYER_GONE_KEY, this.seatMember(roomId, userId));
  }

  /**
   * Seats whose grace has elapsed. As with the host, ZREM is the claim, so one
   * instance acts on each seat however many are running.
   */
  async claimForfeitedSeats(): Promise<
    Array<{ roomId: string; userId: string }>
  > {
    const client = this.redis.getClient();
    const due = await client.zrangebyscore(
      ROOM_PLAYER_GONE_KEY,
      '-inf',
      Date.now(),
    );

    const claimed: Array<{ roomId: string; userId: string }> = [];
    for (const member of due) {
      if ((await client.zrem(ROOM_PLAYER_GONE_KEY, member)) === 0) {
        continue;
      }
      // A uuid has no colon in it, so the first one is the separator.
      const separator = member.indexOf(':');
      if (separator > 0) {
        claimed.push({
          roomId: member.slice(0, separator),
          userId: member.slice(separator + 1),
        });
      }
    }

    return claimed;
  }

  /**
   * Room ids whose grace period has elapsed. ZREM is the claim: it returns 1 to
   * exactly one instance, so a room is announced once however many are running.
   */
  async claimLapsedHostGraces(): Promise<string[]> {
    const client = this.redis.getClient();
    const due = await client.zrangebyscore(
      ROOM_HOST_GONE_KEY,
      '-inf',
      Date.now(),
    );

    const claimed: string[] = [];
    for (const roomId of due) {
      if ((await client.zrem(ROOM_HOST_GONE_KEY, roomId)) > 0) {
        claimed.push(roomId);
      }
    }

    return claimed;
  }
}
