import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FameTier } from '@prisma/client';
import { TrackRepository } from '../../track/repositories/track.repository';
import { PoolTrackRepository } from '../repositories/pool-track.repository';
import { PoolService } from './pool.service';
import { POOL_CANDIDATE_CACHE_MS } from '../../consts';

const candidate = (id: string, fame: number, year = 2005) => ({
  id,
  fame,
  year,
});

describe('PoolService', () => {
  let service: PoolService;
  let poolTracks: {
    findCandidates: jest.Mock;
    findAllFame: jest.Mock;
    count: jest.Mock;
    stats: jest.Mock;
  };
  let tracks: { findById: jest.Mock };

  beforeEach(async () => {
    poolTracks = {
      findCandidates: jest.fn().mockResolvedValue([candidate('dz:1', 500)]),
      findAllFame: jest.fn().mockResolvedValue([500]),
      count: jest.fn().mockResolvedValue(1),
      stats: jest.fn(),
    };
    tracks = {
      findById: jest.fn().mockResolvedValue({ id: 'dz:1', name: 'Song' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PoolService,
        { provide: PoolTrackRepository, useValue: poolTracks },
        { provide: TrackRepository, useValue: tracks },
      ],
    }).compile();

    service = moduleRef.get(PoolService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the track behind the picked pool entry', async () => {
    await expect(service.pickTrack()).resolves.toMatchObject({ id: 'dz:1' });
    expect(tracks.findById).toHaveBeenCalledWith('dz:1');
  });

  describe('tiers', () => {
    // Ten songs across the whole pool, two per tier: 100 and 90 are Easy.
    const wholePool = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    beforeEach(() => {
      poolTracks.findAllFame.mockResolvedValue(wholePool);
      tracks.findById.mockImplementation((id: string) =>
        Promise.resolve({ id }),
      );
    });

    it('draws only songs of the tier asked for', async () => {
      poolTracks.findCandidates.mockResolvedValue(
        wholePool.map((fame) => candidate(`dz:${fame}`, fame)),
      );

      for (let i = 0; i < 20; i++) {
        const track = await service.pickTrack([], undefined, {
          tier: FameTier.EASY,
        });
        expect(['dz:90', 'dz:100']).toContain(track.id);
      }
    });

    // The scale is the whole pool's: a set of obscure songs has no Easy ones.
    it('judges a set against the whole pool, not against itself', async () => {
      poolTracks.findCandidates.mockResolvedValue([
        candidate('dz:10', 10),
        candidate('dz:60', 60),
      ]);

      const track = await service.pickTrack([], 'group-old', {
        tier: FameTier.IMPOSSIBLE,
      });

      expect(track.id).toBe('dz:10');
    });

    it('stands in the nearest tier once a set has run out of one', async () => {
      poolTracks.findCandidates.mockResolvedValue([
        candidate('dz:10', 10),
        candidate('dz:60', 60),
      ]);

      const track = await service.pickTrack([], 'group-old', {
        tier: FameTier.EASY,
      });

      expect(track.id).toBe('dz:60');
    });

    it('draws from the whole list when no tier is asked for', async () => {
      poolTracks.findCandidates.mockResolvedValue([candidate('dz:10', 10)]);

      await expect(service.pickTrack()).resolves.toMatchObject({
        id: 'dz:10',
      });
      expect(poolTracks.findAllFame).not.toHaveBeenCalled();
    });
  });

  it('reads the candidate list once across repeated picks', async () => {
    await service.pickTrack();
    await service.pickTrack();
    await service.pickTrack();

    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(1);
  });

  it('re-reads the candidate list once the cache has aged out', async () => {
    await service.pickTrack();

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + POOL_CANDIDATE_CACHE_MS + 1);
    await service.pickTrack();

    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(2);
  });

  it('caches the whole pool, not the exclusions', async () => {
    // Exclusions are applied in memory precisely so they cannot fragment the
    // cache; a differing exclude list must not trigger another read.
    await service.pickTrack(['dz:99']);
    await service.pickTrack(['dz:98']);

    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(1);
    expect(poolTracks.findCandidates).toHaveBeenCalledWith([], undefined);
  });

  it('leaves special tracks out of an untargeted draw', async () => {
    // They belong to one group. Arriving in the shuffle or the daily, they are
    // a surprise nobody asked for.
    await service.pickTrack();

    expect(poolTracks.findCandidates).toHaveBeenCalledWith([], undefined);
  });

  it('reads a group separately rather than reusing the whole pool', async () => {
    await service.pickTrack([], 'group-eighties');
    await service.pickTrack([], 'group-nineties');

    expect(poolTracks.findCandidates).toHaveBeenCalledWith(
      [],
      'group-eighties',
    );
    expect(poolTracks.findCandidates).toHaveBeenCalledWith(
      [],
      'group-nineties',
    );
    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(2);
  });

  it('caches each group on its own, so one does not answer for another', async () => {
    await service.pickTrack([], 'group-eighties');
    await service.pickTrack([], 'group-eighties');
    await service.pickTrack();

    // Twice, not three times: the second eighties round is cached, and the
    // whole-pool round is a different list entirely.
    expect(poolTracks.findCandidates).toHaveBeenCalledTimes(2);
  });

  it('says which group came up empty rather than blaming the pool', async () => {
    poolTracks.findCandidates.mockResolvedValue([]);

    await expect(service.pickTrack([], 'group-eighties')).rejects.toThrow(
      'group-eighties',
    );
  });

  it('throws when the pool has nothing left to offer', async () => {
    poolTracks.findCandidates.mockResolvedValue([]);

    await expect(service.pickTrack()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when a pool entry has no matching track row', async () => {
    tracks.findById.mockResolvedValue(null);

    await expect(service.pickTrack()).rejects.toThrow('missing from tracks');
  });

  it('is not ready while the pool is empty', async () => {
    poolTracks.findCandidates.mockResolvedValue([]);

    await expect(service.isReady()).resolves.toBe(false);
  });
});
