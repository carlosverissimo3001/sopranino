import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { RedisService } from '../../redis/redis.service';
import { CHAT_HISTORY_SIZE, CHAT_MAX_LENGTH, CHAT_TTL } from '../../consts';

describe('ChatService', () => {
  let service: ChatService;
  let redis: {
    pushCapped: jest.Mock;
    listOldestFirst: jest.Mock;
    del: jest.Mock;
    increment: jest.Mock;
    get: jest.Mock;
  };

  beforeEach(async () => {
    redis = {
      pushCapped: jest.fn().mockResolvedValue(undefined),
      listOldestFirst: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, { provide: RedisService, useValue: redis }],
    }).compile();

    service = module.get(ChatService);
  });

  const author = { userId: 'u1', displayName: 'Ana' };

  describe('clean', () => {
    it('collapses whitespace and trims', () => {
      expect(service.clean('  hey   there \n ')).toBe('hey there');
    });

    it('caps the length', () => {
      expect(service.clean('a'.repeat(500))).toHaveLength(CHAT_MAX_LENGTH);
    });

    it('leaves nothing for a message that was only whitespace', () => {
      expect(service.clean('   ')).toBe('');
    });
  });

  describe('append', () => {
    it('writes to the room key, capped and with a ttl', async () => {
      await service.append('room-1', author, 'gg');

      expect(redis.pushCapped).toHaveBeenCalledWith(
        'room:chat:room-1',
        expect.any(String),
        CHAT_HISTORY_SIZE,
        CHAT_TTL,
      );
    });

    it('returns the message it stored', async () => {
      const message = await service.append('room-1', author, 'gg');
      const [, stored] = redis.pushCapped.mock.calls[0] as [string, string];

      expect(JSON.parse(stored)).toEqual(message);
      expect(message).toMatchObject({
        userId: 'u1',
        displayName: 'Ana',
        text: 'gg',
      });
    });

    it('leaves the avatar out rather than sending null', async () => {
      const message = await service.append('room-1', author, 'gg');
      expect(message).not.toHaveProperty('avatarUrl');
    });
  });

  describe('strikes', () => {
    it('counts against the room and the player together', async () => {
      redis.increment.mockResolvedValue(1);

      expect(await service.strike('room-1', 'u1')).toEqual({
        used: 1,
        left: 2,
      });
      expect(redis.increment).toHaveBeenCalledWith(
        'room:chat-strikes:room-1:u1',
        CHAT_TTL,
      );
    });

    it('never reports a negative number left', async () => {
      redis.increment.mockResolvedValue(7);

      expect(await service.strike('room-1', 'u1')).toEqual({
        used: 7,
        left: 0,
      });
    });

    it('mutes at the third, not the second', async () => {
      redis.get.mockResolvedValue('2');
      expect(await service.isMuted('room-1', 'u1')).toBe(false);

      redis.get.mockResolvedValue('3');
      expect(await service.isMuted('room-1', 'u1')).toBe(true);
    });

    it('treats a player with no strikes as free to talk', async () => {
      redis.get.mockResolvedValue(null);

      expect(await service.isMuted('room-1', 'u1')).toBe(false);
    });
  });

  describe('a removed message', () => {
    it('is stored with the flag and no text', async () => {
      const message = await service.append('room-1', author, '', true);

      expect(message).toMatchObject({ removed: true, text: '' });
    });

    it('is not marked on an ordinary message', async () => {
      const message = await service.append('room-1', author, 'gg');

      expect(message).not.toHaveProperty('removed');
    });
  });

  describe('history', () => {
    it('reads the channel oldest first', async () => {
      redis.listOldestFirst.mockResolvedValue([
        JSON.stringify({ id: '1', text: 'first' }),
        JSON.stringify({ id: '2', text: 'second' }),
      ]);

      const history = await service.history('room-1');

      expect(redis.listOldestFirst).toHaveBeenCalledWith('room:chat:room-1');
      expect(history.map((m) => m.text)).toEqual(['first', 'second']);
    });

    // A half-written entry would otherwise take the whole panel down.
    it('skips an entry it cannot parse', async () => {
      redis.listOldestFirst.mockResolvedValue([
        'not json',
        JSON.stringify({ id: '2', text: 'second' }),
      ]);

      expect(await service.history('room-1')).toHaveLength(1);
    });
  });
});
