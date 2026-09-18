import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { ChatMessageDto } from '../dto/chat-message.dto';
import {
  CHAT_HISTORY_SIZE,
  CHAT_MAX_LENGTH,
  CHAT_PREFIX,
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

  async append(
    channel: string,
    author: { userId: string; displayName: string; avatarUrl?: string },
    text: string,
  ): Promise<ChatMessageDto> {
    const message: ChatMessageDto = {
      id: randomUUID(),
      userId: author.userId,
      displayName: author.displayName,
      ...(author.avatarUrl && { avatarUrl: author.avatarUrl }),
      text,
      sentAt: new Date().toISOString(),
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
