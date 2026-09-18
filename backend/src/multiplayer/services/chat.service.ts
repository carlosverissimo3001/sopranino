import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { ChatMessageDto } from '../dto/chat-message.dto';
import {
  CHAT_HISTORY_SIZE,
  CHAT_MAX_LENGTH,
  CHAT_PREFIX,
  CHAT_STRIKE_PREFIX,
  CHAT_STRIKES,
  CHAT_TTL,
} from '../../consts';

/**
 * Chat lives in Redis and nowhere else. It is the one thing here written by a
 * person about a person, and keeping it would buy only an obligation to hand
 * it over, delete it on request, and explain why it exists.
 */
@Injectable()
export class ChatService {
  constructor(private readonly redis: RedisService) {}

  private key(channel: string): string {
    return `${CHAT_PREFIX}${channel}`;
  }

  clean(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LENGTH);
  }

  private strikeKey(channel: string, userId: string): string {
    return `${CHAT_STRIKE_PREFIX}${channel}:${userId}`;
  }

  /**
   * Counts a blocked message and says what is left. Redis rather than the
   * socket: a strike has to survive a refresh, or it is not a strike.
   */
  async strike(
    channel: string,
    userId: string,
  ): Promise<{ used: number; left: number }> {
    const used = await this.redis.increment(
      this.strikeKey(channel, userId),
      CHAT_TTL,
    );
    return { used, left: Math.max(0, CHAT_STRIKES - used) };
  }

  async isMuted(channel: string, userId: string): Promise<boolean> {
    const used = await this.redis.get(this.strikeKey(channel, userId));
    return Number(used ?? 0) >= CHAT_STRIKES;
  }

  async append(
    channel: string,
    author: { userId: string; displayName: string; avatarUrl?: string },
    text: string,
    removed = false,
  ): Promise<ChatMessageDto> {
    const message: ChatMessageDto = {
      id: randomUUID(),
      userId: author.userId,
      displayName: author.displayName,
      ...(author.avatarUrl && { avatarUrl: author.avatarUrl }),
      text,
      sentAt: new Date().toISOString(),
      ...(removed && { removed: true }),
    };

    await this.redis.pushCapped(
      this.key(channel),
      JSON.stringify(message),
      CHAT_HISTORY_SIZE,
      CHAT_TTL,
    );

    return message;
  }

  /** The room speaking for itself: no author, and nothing to report. */
  async announce(channel: string, text: string): Promise<ChatMessageDto> {
    const message: ChatMessageDto = {
      id: randomUUID(),
      userId: '',
      displayName: '',
      text,
      sentAt: new Date().toISOString(),
      system: true,
    };

    await this.redis.pushCapped(
      this.key(channel),
      JSON.stringify(message),
      CHAT_HISTORY_SIZE,
      CHAT_TTL,
    );

    return message;
  }

  async history(channel: string): Promise<ChatMessageDto[]> {
    const raw = await this.redis.listOldestFirst(this.key(channel));
    return raw.flatMap((entry) => {
      try {
        return [JSON.parse(entry) as ChatMessageDto];
      } catch {
        return [];
      }
    });
  }

  async clear(channel: string): Promise<void> {
    await this.redis.del(this.key(channel));
  }
}
