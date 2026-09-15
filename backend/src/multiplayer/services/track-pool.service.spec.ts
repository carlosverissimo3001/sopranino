import { Test, TestingModule } from '@nestjs/testing';
import { TrackPoolService } from './track-pool.service';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { TrackService } from '../../track/services/track.service';
import { SessionService } from '../../auth/services/session.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackSource } from '@prisma/client';
import { UserRepository } from '../../auth/repositories/user.repository';
import { PoolService } from '../../pool/services/pool.service';

function makeTrack(id: string, name = `Track ${id}`) {
  return {
    id,
    name,
    normalizedName: name.toLowerCase(),
    artists: ['Artist'],
    albumName: 'Album',
    albumId: 'album-1',
    imageUrl: 'https://img.test/1.jpg',
    durationMs: 200000,
    externalUrl: `https://open.spotify.com/track/${id}`,
    previewUrl: `https://preview.test/${id}.mp3`,
    isPlayable: true,
    primaryArtist: 'Artist',
    releaseYear: 2024,
    allArtists: ['Artist'],
  };
}

describe('TrackPoolService', () => {
  let service: TrackPoolService;
  let playlistService: jest.Mocked<PlaylistService>;
  let trackService: jest.Mocked<TrackService>;
  let sessionService: jest.Mocked<SessionService>;
  let userRepository: {
    findExistingIds: jest.Mock;
    filterWithCredential: jest.Mock;
  };
  let poolService: { pickTrack: jest.Mock };

  beforeEach(async () => {
    playlistService = {
      getLikedSongsMetadata: jest.fn(),
      getLikedTracksBatch: jest.fn(),
    } as any;

    trackService = {
      getTrackWithPreview: jest.fn(),
    } as any;

    sessionService = {
      getSessionIdByUserId: jest.fn(),
    } as any;

    userRepository = {
      findExistingIds: jest.fn(),
      // Every player is linked unless a case says otherwise.
      filterWithCredential: jest
        .fn()
        .mockImplementation((ids: string[]) => Promise.resolve(ids)),
    };

    poolService = { pickTrack: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackPoolService,
        { provide: PlaylistService, useValue: playlistService },
        { provide: TrackService, useValue: trackService },
        { provide: SessionService, useValue: sessionService },
        { provide: UserRepository, useValue: userRepository },
        { provide: PoolService, useValue: poolService },
        { provide: AppLoggerService, useValue: new AppLoggerService() },
      ],
    }).compile();

    service = module.get(TrackPoolService);
  });

  it('should select tracks weighted by likedByCount', async () => {
    // 2 players, both like track-A, only player1 likes track-B
    const trackA = makeTrack('track-A');
    const trackB = makeTrack('track-B');

    userRepository.findExistingIds.mockResolvedValueOnce(['user-1', 'user-2']);

    sessionService.getSessionIdByUserId
      .mockResolvedValueOnce('sess-1')
      .mockResolvedValueOnce('sess-2');

    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 100,
    } as any);

    // Player 1 has both tracks, Player 2 has only track-A
    playlistService.getLikedTracksBatch
      .mockResolvedValueOnce([trackA, trackB])
      .mockResolvedValueOnce([trackA, trackB])
      .mockResolvedValueOnce([trackA, trackB])
      .mockResolvedValueOnce([trackA])
      .mockResolvedValueOnce([trackA])
      .mockResolvedValueOnce([trackA]);

    trackService.getTrackWithPreview.mockImplementation(
      async (id: string) =>
        ({
          id,
          previewUrl: `https://preview/${id}.mp3`,
          name: `Track ${id}`,
          artistName: 'Artist',
          albumImageUrl: undefined,
          albumName: undefined,
          albumUrl: undefined,
          releaseYear: undefined,
          metadata: {},
          lastScrapedAt: new Date(),
          createdAt: new Date(),
        }) as any,
    );

    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1', 'user-2'],
      roundCount: 2,
      trackSource: TrackSource.LIBRARIES,
    });

    expect(result).toHaveLength(2);
    expect(result).toContain('track-A');
    expect(result).toContain('track-B');
  });

  it('should skip players without active sessions', async () => {
    const track = makeTrack('track-1');

    userRepository.findExistingIds.mockResolvedValueOnce(['user-1', 'user-2']);

    sessionService.getSessionIdByUserId
      .mockResolvedValueOnce('sess-1')
      .mockResolvedValueOnce(null); // player 2 has no session

    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 50,
    } as any);

    playlistService.getLikedTracksBatch.mockResolvedValue([track]);

    trackService.getTrackWithPreview.mockResolvedValue({
      id: track.id,
      previewUrl: 'https://preview/1.mp3',
      name: track.name,
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1', 'user-2'],
      roundCount: 1,
      trackSource: TrackSource.LIBRARIES,
    });

    expect(result).toHaveLength(1);
    // Only player 1's session was used
    expect(sessionService.getSessionIdByUserId).toHaveBeenCalledTimes(2);
  });

  it('should throw when no active sessions exist', async () => {
    userRepository.findExistingIds.mockResolvedValue(['user-1']);
    sessionService.getSessionIdByUserId.mockResolvedValue(null);

    await expect(
      service.selectTracksForRoom({
        playerUserIds: ['user-1'],
        roundCount: 3,
        trackSource: TrackSource.LIBRARIES,
      }),
    ).rejects.toThrow('No active sessions found');
  });

  it('should throw when no tracks have valid previews', async () => {
    userRepository.findExistingIds.mockResolvedValue(['user-1']);
    sessionService.getSessionIdByUserId.mockResolvedValue('sess-1');
    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 10,
    } as any);

    const trackNoPreview = makeTrack('no-preview');
    playlistService.getLikedTracksBatch.mockResolvedValue([trackNoPreview]);

    // Preview resolution fails
    trackService.getTrackWithPreview.mockResolvedValue({
      id: 'no-preview',
      previewUrl: undefined,
      name: 'No Preview',
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    await expect(
      service.selectTracksForRoom({
        playerUserIds: ['user-1'],
        roundCount: 3,
        trackSource: TrackSource.LIBRARIES,
      }),
    ).rejects.toThrow('Could not find any tracks with valid preview URLs');
  });

  it('should handle player with empty liked songs gracefully', async () => {
    const track = makeTrack('track-1');

    userRepository.findExistingIds.mockResolvedValue(['user-1', 'user-2']);

    sessionService.getSessionIdByUserId
      .mockResolvedValueOnce('sess-1')
      .mockResolvedValueOnce('sess-2');

    // Player 1 has songs, player 2 has none
    playlistService.getLikedSongsMetadata
      .mockResolvedValueOnce({ totalTracks: 50 } as any)
      .mockResolvedValueOnce({ totalTracks: 0 } as any);

    playlistService.getLikedTracksBatch.mockResolvedValue([track]);

    trackService.getTrackWithPreview.mockResolvedValue({
      id: track.id,
      previewUrl: 'https://preview/1.mp3',
      name: track.name,
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1', 'user-2'],
      roundCount: 1,
      trackSource: TrackSource.LIBRARIES,
    });

    expect(result).toHaveLength(1);
  });

  it('should return fewer tracks when pool is too small', async () => {
    const track = makeTrack('only-track');

    userRepository.findExistingIds.mockResolvedValue(['user-1']);
    sessionService.getSessionIdByUserId.mockResolvedValue('sess-1');
    playlistService.getLikedSongsMetadata.mockResolvedValue({
      totalTracks: 1,
    } as any);
    playlistService.getLikedTracksBatch.mockResolvedValue([track]);

    trackService.getTrackWithPreview.mockResolvedValue({
      id: track.id,
      previewUrl: 'https://preview/only.mp3',
      name: track.name,
      artistName: 'Artist',
      albumImageUrl: undefined,
      albumName: undefined,
      albumUrl: undefined,
      releaseYear: undefined,
      metadata: {},
      lastScrapedAt: new Date(),
      createdAt: new Date(),
    } as any);

    // Asking for 5 but only 1 track available
    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1'],
      roundCount: 5,
      trackSource: TrackSource.LIBRARIES,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toBe('only-track');
  });
});

describe('choosing where a room draws from', () => {
  // Redeclared here so these cases are readable on their own.
  let service: TrackPoolService;
  let userRepository: {
    findExistingIds: jest.Mock;
    filterWithCredential: jest.Mock;
  };
  let poolService: { pickTrack: jest.Mock };
  let playlistService: { getLikedSongsMetadata: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findExistingIds: jest.fn(),
      // Overridden per case: who in the room actually has a library.
      filterWithCredential: jest.fn().mockResolvedValue([]),
    };
    poolService = { pickTrack: jest.fn() };
    playlistService = { getLikedSongsMetadata: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackPoolService,
        { provide: PlaylistService, useValue: playlistService },
        { provide: TrackService, useValue: { getTrackWithPreview: jest.fn() } },
        {
          provide: SessionService,
          useValue: { getSessionIdByUserId: jest.fn() },
        },
        { provide: UserRepository, useValue: userRepository },
        { provide: PoolService, useValue: poolService },
        { provide: AppLoggerService, useValue: new AppLoggerService() },
      ],
    }).compile();

    service = module.get(TrackPoolService);
  });

  it('draws from the curated pool when the room asked for the pool', async () => {
    poolService.pickTrack
      .mockResolvedValueOnce({ id: 'pool-1' })
      .mockResolvedValueOnce({ id: 'pool-2' });

    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1', 'user-2'],
      roundCount: 2,
      trackSource: TrackSource.POOL,
    });

    expect(result).toEqual(['pool-1', 'pool-2']);
  });

  it('defaults to the pool, so a room never starts on someone library by accident', async () => {
    poolService.pickTrack.mockResolvedValue({ id: 'pool-1' });

    await service.selectTracksForRoom({
      playerUserIds: ['user-1'],
      roundCount: 1,
    });

    expect(playlistService.getLikedSongsMetadata).not.toHaveBeenCalled();
  });

  it('pools only the linked players when a guest is in a libraries room', async () => {
    userRepository.filterWithCredential.mockResolvedValue(['linked-user']);
    userRepository.findExistingIds.mockResolvedValue(['linked-user']);
    playlistService.getLikedSongsMetadata.mockResolvedValue({ totalTracks: 0 });

    await service
      .selectTracksForRoom({
        playerUserIds: ['linked-user', 'guest-user'],
        roundCount: 2,
        trackSource: TrackSource.LIBRARIES,
      })
      .catch(() => {
        /* an empty library is not what this case is about */
      });

    // The guest is never looked up for a session, so never pooled from.
    expect(userRepository.findExistingIds).toHaveBeenCalledWith([
      'linked-user',
    ]);
  });

  it('falls back to the pool when a libraries room has nobody with a library', async () => {
    userRepository.filterWithCredential.mockResolvedValue([]);
    poolService.pickTrack.mockResolvedValue({ id: 'pool-1' });

    const result = await service.selectTracksForRoom({
      playerUserIds: ['guest-1', 'guest-2'],
      roundCount: 1,
      trackSource: TrackSource.LIBRARIES,
    });

    expect(result).toEqual(['pool-1']);
  });

  it('excludes tracks already drawn so a room cannot repeat a song', async () => {
    poolService.pickTrack
      .mockResolvedValueOnce({ id: 'pool-1' })
      .mockResolvedValueOnce({ id: 'pool-2' });

    await service.selectTracksForRoom({
      playerUserIds: ['user-1'],
      roundCount: 2,
      trackSource: TrackSource.POOL,
    });

    expect(poolService.pickTrack).toHaveBeenNthCalledWith(
      2,
      ['pool-1'],
      undefined,
    );
  });

  it("draws a set room's songs from that set", async () => {
    poolService.pickTrack
      .mockResolvedValueOnce({ id: 'set-1' })
      .mockResolvedValueOnce({ id: 'set-2' });

    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1'],
      roundCount: 2,
      trackSource: TrackSource.SET,
      trackGroupId: 'set-taylor',
    });

    expect(result).toEqual(['set-1', 'set-2']);
    expect(poolService.pickTrack).toHaveBeenNthCalledWith(
      2,
      ['set-1'],
      'set-taylor',
    );
    expect(playlistService.getLikedSongsMetadata).not.toHaveBeenCalled();
  });

  it('refuses a set room with no set rather than guessing one', async () => {
    await expect(
      service.selectTracksForRoom({
        playerUserIds: ['user-1'],
        roundCount: 2,
        trackSource: TrackSource.SET,
      }),
    ).rejects.toThrow('This room has no set to play from');
  });

  it('returns what it has when the pool runs dry mid-selection', async () => {
    poolService.pickTrack
      .mockResolvedValueOnce({ id: 'pool-1' })
      .mockRejectedValueOnce(new Error('No guest track available'));

    const result = await service.selectTracksForRoom({
      playerUserIds: ['user-1'],
      roundCount: 3,
      trackSource: TrackSource.POOL,
    });

    expect(result).toEqual(['pool-1']);
  });

  it('fails loudly when the pool is empty rather than starting an empty room', async () => {
    poolService.pickTrack.mockRejectedValue(
      new Error('No guest track available'),
    );

    await expect(
      service.selectTracksForRoom({
        playerUserIds: ['user-1'],
        roundCount: 3,
        trackSource: TrackSource.POOL,
      }),
    ).rejects.toThrow('No curated tracks available');
  });
});
