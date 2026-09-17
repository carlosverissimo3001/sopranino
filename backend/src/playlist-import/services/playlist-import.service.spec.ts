import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PlaylistSource, Prisma, TrackGroupType } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { PLAYLIST_IMPORT_QUEUE } from '../../consts';
import { AppLoggerService } from '../../logger/logger.service';
import { PoolService } from '../../pool/services/pool.service';
import { RedisService } from '../../redis/redis.service';
import { TrackGroupService } from '../../track-group/services/track-group.service';
import { IMPORT_MAX_TRACKS } from '../consts';
import {
  PLAYLIST_PROVIDERS,
  PlaylistUnavailableError,
} from '../providers/playlist-provider';
import { PlaylistImportRepository } from '../repositories/playlist-import.repository';
import { PlaylistImportService } from './playlist-import.service';

jest.mock('@transaction/transaction.store', () => ({
  ...jest.requireActual('@transaction/transaction.store'),
  getBasePrismaClient: () => ({
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  }),
}));

const LINK = 'https://www.deezer.com/playlist/42';

const group = (overrides: Record<string, unknown> = {}) => ({
  id: 'set-1',
  type: TrackGroupType.IMPORTED,
  name: 'Road trip',
  slug: 'deezer-42',
  imageUrl: null,
  createdAt: new Date(),
  _count: { tracks: 0 },
  import: {
    trackGroupId: 'set-1',
    source: PlaylistSource.DEEZER,
    externalId: '42',
    checksum: null as string | null,
    refreshedAt: null as Date | null,
    staleSince: null as Date | null,
    createdAt: new Date(),
  },
  ...overrides,
});

describe('PlaylistImportService', () => {
  let service: PlaylistImportService;

  const repository = {
    findByExternal: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    addMember: jest.fn(),
    listForUser: jest.fn(),
    removeMember: jest.fn(),
    countMembers: jest.fn(),
    delete: jest.fn(),
    updateAfterFill: jest.fn(),
    markFresh: jest.fn(),
    markStale: jest.fn(),
  };
  const deezer = {
    source: PlaylistSource.DEEZER,
    resolveId: jest.fn(),
    info: jest.fn(),
    members: jest.fn(),
  };
  const redisClient = { set: jest.fn(), del: jest.fn() };
  const queue = { add: jest.fn(), getWaitingCount: jest.fn() };
  const trackGroups = { replaceMembers: jest.fn() };
  const pool = { forget: jest.fn() };
  const auth = { getUserBySessionId: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    auth.getUserBySessionId.mockResolvedValue({ id: 'user-1' });
    deezer.resolveId.mockResolvedValue('42');
    deezer.info.mockResolvedValue({
      title: 'Road trip',
      checksum: 'abc',
      trackCount: 30,
    });
    repository.findByExternal.mockResolvedValue(null);
    repository.create.mockResolvedValue(group());
    queue.getWaitingCount.mockResolvedValue(0);
    redisClient.set.mockResolvedValue('OK');

    const module = await Test.createTestingModule({
      providers: [
        PlaylistImportService,
        { provide: PlaylistImportRepository, useValue: repository },
        { provide: AuthService, useValue: auth },
        { provide: PoolService, useValue: pool },
        { provide: TrackGroupService, useValue: trackGroups },
        { provide: RedisService, useValue: { getClient: () => redisClient } },
        { provide: getQueueToken(PLAYLIST_IMPORT_QUEUE), useValue: queue },
        { provide: PLAYLIST_PROVIDERS, useValue: [deezer] },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), log: jest.fn() }) },
        },
      ],
    }).compile();
    service = module.get(PlaylistImportService);
  });

  describe('importing', () => {
    const importDeezer = () =>
      service.import('session-1', {
        source: PlaylistSource.DEEZER,
        link: LINK,
      });

    it('creates the set for the player and queues its songs', async () => {
      const result = await importDeezer();

      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        source: PlaylistSource.DEEZER,
        externalId: '42',
        name: 'Road trip',
        imageUrl: undefined,
        origin: undefined,
      });
      expect(queue.add).toHaveBeenCalledWith(
        expect.any(String),
        { trackGroupId: 'set-1' },
        expect.objectContaining({ jobId: 'fill-set-1' }),
      );
      expect(result).toMatchObject({
        id: 'set-1',
        pending: true,
        externalUrl: 'https://www.deezer.com/playlist/42',
      });
    });

    // The second person to paste a link costs Deezer nothing and spends no day.
    it('joins a playlist someone already imported', async () => {
      repository.findByExternal.mockResolvedValue(group());

      await importDeezer();

      expect(repository.addMember).toHaveBeenCalledWith(
        'user-1',
        'set-1',
        undefined,
      );
      expect(deezer.info).not.toHaveBeenCalled();
      expect(redisClient.set).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    // The copy is Deezer's; where the player keeps it is theirs alone.
    it('keeps the service the player copied from', async () => {
      const result = await service.import('session-1', {
        source: PlaylistSource.DEEZER,
        link: 'https://www.deezer.com/playlist/42',
        origin: PlaylistSource.SPOTIFY,
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ origin: PlaylistSource.SPOTIFY }),
      );
      expect(result.origin).toBe(PlaylistSource.SPOTIFY);
    });

    it('says a service it cannot read yet is not supported', async () => {
      await expect(
        service.import('session-1', {
          source: PlaylistSource.SPOTIFY,
          link: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('refuses a link that leads nowhere', async () => {
      deezer.resolveId.mockResolvedValue(null);

      await expect(importDeezer()).rejects.toThrow(BadRequestException);
    });

    it('turns a new import away while the queue is full', async () => {
      queue.getWaitingCount.mockResolvedValue(20);

      await expect(importDeezer()).rejects.toThrow(ServiceUnavailableException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    // Claimed last: a bad link should not spend the day.
    it('says a private playlist is missing, and keeps the day', async () => {
      deezer.info.mockRejectedValue(new PlaylistUnavailableError('42'));

      await expect(importDeezer()).rejects.toThrow(NotFoundException);
      expect(redisClient.set).not.toHaveBeenCalled();
    });

    it('refuses a playlist past the size cap', async () => {
      deezer.info.mockResolvedValue({
        title: 'Everything',
        trackCount: IMPORT_MAX_TRACKS + 1,
      });

      await expect(importDeezer()).rejects.toThrow(BadRequestException);
      expect(redisClient.set).not.toHaveBeenCalled();
    });

    it('allows one new playlist a day', async () => {
      redisClient.set.mockResolvedValue(null);

      await expect(importDeezer()).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('joins instead when someone created it a moment earlier', async () => {
      repository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      repository.findByExternal
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(group());

      await importDeezer();

      expect(repository.addMember).toHaveBeenCalledWith(
        'user-1',
        'set-1',
        undefined,
      );
      expect(redisClient.del).toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('listing', () => {
    it('queues a refresh only for sets past the hour', async () => {
      const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recent = new Date();
      repository.listForUser.mockResolvedValue([
        group({ id: 'old', import: { ...group().import, refreshedAt: old } }),
        group({
          id: 'new',
          import: { ...group().import, refreshedAt: recent },
        }),
        group({ id: 'pending' }),
      ]);

      await service.list('session-1');

      expect(queue.add).toHaveBeenCalledTimes(1);
      expect(queue.add).toHaveBeenCalledWith(
        expect.any(String),
        { trackGroupId: 'old' },
        expect.anything(),
      );
    });
  });

  describe('leaving', () => {
    it('says a set that is not theirs is missing', async () => {
      repository.removeMember.mockResolvedValue(false);

      await expect(service.leave('session-1', 'set-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('keeps the set while someone else still has it', async () => {
      repository.removeMember.mockResolvedValue(true);
      repository.countMembers.mockResolvedValue(1);

      await service.leave('session-1', 'set-1');

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deletes the set with its last member', async () => {
      repository.removeMember.mockResolvedValue(true);
      repository.countMembers.mockResolvedValue(0);

      await service.leave('session-1', 'set-1');

      expect(repository.delete).toHaveBeenCalledWith('set-1');
      expect(pool.forget).toHaveBeenCalledWith('set-1');
    });
  });

  describe('filling', () => {
    it('writes the songs and marks the set read', async () => {
      repository.findById.mockResolvedValue(group());
      deezer.members.mockResolvedValue([{ trackId: 'dz:1' }]);

      await service.fill('set-1');

      expect(trackGroups.replaceMembers).toHaveBeenCalledWith('set-1', [
        { trackId: 'dz:1' },
      ]);
      expect(repository.updateAfterFill).toHaveBeenCalledWith('set-1', {
        name: 'Road trip',
        imageUrl: undefined,
        checksum: 'abc',
      });
    });

    it('skips the songs when the playlist has not changed', async () => {
      repository.findById.mockResolvedValue(
        group({
          import: {
            ...group().import,
            checksum: 'abc',
            refreshedAt: new Date(),
          },
        }),
      );

      await service.fill('set-1');

      expect(deezer.members).not.toHaveBeenCalled();
      expect(repository.markFresh).toHaveBeenCalledWith('set-1');
    });

    it('keeps the last songs of a playlist that went private', async () => {
      repository.findById.mockResolvedValue(group());
      deezer.info.mockRejectedValue(new PlaylistUnavailableError('42'));

      await service.fill('set-1');

      expect(repository.markStale).toHaveBeenCalledWith('set-1');
      expect(trackGroups.replaceMembers).not.toHaveBeenCalled();
    });

    // Throwing is what makes the queue retry a Deezer outage.
    it('lets any other failure through', async () => {
      repository.findById.mockResolvedValue(group());
      deezer.info.mockRejectedValue(new Error('Deezer did not answer'));

      await expect(service.fill('set-1')).rejects.toThrow('did not answer');
      expect(repository.markStale).not.toHaveBeenCalled();
    });

    it('does nothing for a set that is gone', async () => {
      repository.findById.mockResolvedValue(null);

      await service.fill('set-1');

      expect(deezer.info).not.toHaveBeenCalled();
    });
  });
});
