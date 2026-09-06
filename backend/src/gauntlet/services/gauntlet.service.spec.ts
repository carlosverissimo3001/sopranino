import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  GauntletDifficulty,
  GauntletEndReason,
  GauntletRunStatus,
  GauntletSource,
  TrackGroupType,
} from '@prisma/client';
import { StartRunDto } from '../dto/start-run.dto';
import type { PrismaClient } from '@prisma/client';
import { setBasePrismaClient } from '@transaction/transaction.store';
import { GauntletService } from './gauntlet.service';
import { GauntletRunRepository } from '../repositories/gauntlet-run.repository';
import { AuthService } from '@auth/services/auth.service';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { PoolService } from '../../pool/services/pool.service';
import { TrackGroupService } from '../../track-group/services/track-group.service';
import { TrackService } from '../../track/services/track.service';
import { AppLoggerService } from '../../logger/logger.service';

const SESSION_ID = 'session-1';
const ME = 'user-me';

const mockRepo = {
  findLeaderboardEntries: jest.fn(),
  findUserBestInPeriod: jest.fn(),
  countUsersWithHigherScore: jest.fn(),
};

const mockAuthService = { getUserBySessionId: jest.fn() };

const mockLogger = {
  child: () => ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() }),
};

function entry(overrides: Record<string, unknown>) {
  return {
    userId: 'user-other',
    displayName: 'Neon Riff',
    avatarUrl: 'https://example.test/a.png',
    score: 10,
    showStatsToOthers: true,
    ...overrides,
  };
}

describe('GauntletService.getLeaderboard', () => {
  let service: GauntletService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuthService.getUserBySessionId.mockResolvedValue({ id: ME });
    mockRepo.findUserBestInPeriod.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GauntletService,
        { provide: GauntletRunRepository, useValue: mockRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PlaylistService, useValue: {} },
        { provide: PoolService, useValue: {} },
        { provide: TrackGroupService, useValue: {} },
        { provide: TrackService, useValue: {} },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(GauntletService);
  });

  it('names a player who has not hidden their stats', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([entry({})]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
      GauntletDifficulty.MEDIUM,
    );

    expect(entries[0]).toMatchObject({
      displayName: 'Neon Riff',
      userId: 'user-other',
      isHidden: false,
    });
  });

  it('strips the name, avatar and id of a hidden player', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ showStatsToOthers: false }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
      GauntletDifficulty.MEDIUM,
    );

    expect(entries[0]).toEqual({
      rank: 1,
      userId: 'hidden:1',
      displayName: 'Anonymous',
      isHidden: true,
      score: 10,
    });
  });

  it('keeps the hidden entry ranked in place', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ userId: 'a', score: 30 }),
      entry({ userId: 'b', score: 20, showStatsToOthers: false }),
      entry({ userId: 'c', score: 10 }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
      GauntletDifficulty.MEDIUM,
    );

    expect(entries.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(entries[1].score).toBe(20);
  });

  it('still shows hidden players themselves by name', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ userId: ME, displayName: 'Carlos', showStatsToOthers: false }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      0,
      GauntletDifficulty.MEDIUM,
    );

    expect(entries[0]).toMatchObject({
      userId: ME,
      displayName: 'Carlos',
      isHidden: false,
    });
  });

  it('offsets the placeholder id so a later page cannot collide', async () => {
    mockRepo.findLeaderboardEntries.mockResolvedValue([
      entry({ showStatsToOthers: false }),
    ]);

    const { entries } = await service.getLeaderboard(
      SESSION_ID,
      'alltime',
      10,
      10,
      GauntletDifficulty.MEDIUM,
    );

    expect(entries[0].userId).toBe('hidden:11');
  });
});

const RUN_ID = 'run-1';
const PLAYLIST = 'playlist-a';
const GROUP = 'group-90s';

function startDto(overrides: Record<string, unknown> = {}) {
  return {
    source: GauntletSource.PLAYLIST,
    playlistId: PLAYLIST,
    difficulty: GauntletDifficulty.MEDIUM,
    ...overrides,
  } as StartRunDto;
}

function run(overrides: Record<string, unknown> = {}) {
  return {
    id: RUN_ID,
    userId: ME,
    score: 0,
    status: GauntletRunStatus.PLAYING,
    difficulty: GauntletDifficulty.MEDIUM,
    source: GauntletSource.PLAYLIST,
    sourceId: PLAYLIST,
    trackIds: [],
    currentTrack: {
      id: 'track-1',
      name: 'Song',
      artistName: 'Artist',
      allArtists: ['Artist'],
    },
    createdAt: new Date(),
    ...overrides,
  };
}

const spotifyTrack = {
  id: 'track-2',
  name: 'Next',
  primaryArtist: 'Artist',
  allArtists: ['Artist'],
  albumName: 'Album',
  albumId: 'album-1',
  imageUrl: 'https://example.test/a.png',
  releaseYear: 2020,
  isrc: 'ISRC2',
};

describe('GauntletService and the source a run draws from', () => {
  let service: GauntletService;
  const repo = {
    create: jest.fn(),
    findActiveRun: jest.fn(),
    findById: jest.fn(),
    setCurrentTrack: jest.fn(),
    incrementScore: jest.fn(),
    endRun: jest.fn(),
    findPersonalBest: jest.fn(),
    findDailyBest: jest.fn(),
  };
  const playlistService = { getPlaylistFirstTracks: jest.fn() };
  const poolService = { pickTrack: jest.fn() };
  const trackGroupService = { requireById: jest.fn() };
  const trackService = {
    playableUrl: jest.fn(),
    getTrackWithPreview: jest.fn(),
    upsertTrack: jest.fn(),
    resolvePreview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // @Transactional() reaches for the client the app sets at bootstrap.
    setBasePrismaClient({
      $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    } as unknown as PrismaClient);
    mockAuthService.getUserBySessionId.mockResolvedValue({
      id: ME,
      spotifyUserId: 'spotify-me',
    });
    repo.findActiveRun.mockResolvedValue(null);
    repo.create.mockImplementation((params) =>
      Promise.resolve(run({ ...params, id: RUN_ID })),
    );
    repo.setCurrentTrack.mockImplementation(() => Promise.resolve(run()));
    repo.incrementScore.mockResolvedValue(run({ score: 1 }));
    repo.findPersonalBest.mockResolvedValue(0);
    repo.findDailyBest.mockResolvedValue(0);
    playlistService.getPlaylistFirstTracks.mockResolvedValue([spotifyTrack]);
    trackService.getTrackWithPreview.mockResolvedValue({
      previewUrl: 'https://example.test/p.mp3',
    });
    trackService.upsertTrack.mockResolvedValue(undefined);
    trackService.resolvePreview.mockResolvedValue('https://example.test/p.mp3');
    poolService.pickTrack.mockResolvedValue({
      id: 'pool-track-1',
      name: 'Pool Song',
      artistName: 'Artist',
    });
    trackGroupService.requireById.mockResolvedValue({
      id: GROUP,
      type: TrackGroupType.DECADE,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GauntletService,
        { provide: GauntletRunRepository, useValue: repo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PlaylistService, useValue: playlistService },
        { provide: PoolService, useValue: poolService },
        { provide: TrackGroupService, useValue: trackGroupService },
        { provide: TrackService, useValue: trackService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(GauntletService);
  });

  it('resumes the run when the same source is asked for again', async () => {
    repo.findActiveRun.mockResolvedValue(run());
    trackService.playableUrl.mockResolvedValue('https://example.test/p.mp3');

    const state = await service.startRun(SESSION_ID, startDto());

    expect(state.runId).toBe(RUN_ID);
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.endRun).not.toHaveBeenCalled();
  });

  // The reported bug: play Liked Songs, go home, pick another playlist, and
  // the old run came back with the old song.
  it('does not hand back a run on a source the player has left', async () => {
    repo.findActiveRun.mockResolvedValue(
      run({ sourceId: 'playlist-they-left' }),
    );
    trackService.playableUrl.mockResolvedValue('https://example.test/p.mp3');
    repo.endRun.mockResolvedValue(run({ status: GauntletRunStatus.ENDED }));

    await service.startRun(
      SESSION_ID,
      startDto({ playlistId: 'playlist-now' }),
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 'playlist-now' }),
    );
  });

  it('closes the abandoned run rather than leaving it open forever', async () => {
    repo.findActiveRun.mockResolvedValue(
      run({ sourceId: 'playlist-they-left' }),
    );
    repo.endRun.mockResolvedValue(run({ status: GauntletRunStatus.ENDED }));

    await service.startRun(
      SESSION_ID,
      startDto({ playlistId: 'playlist-now' }),
    );

    expect(repo.endRun).toHaveBeenCalledWith(RUN_ID, GauntletEndReason.QUIT);
  });

  it('does not resume a playlist run when the pool was asked for', async () => {
    repo.findActiveRun.mockResolvedValue(run());
    trackService.playableUrl.mockResolvedValue('https://example.test/p.mp3');
    repo.endRun.mockResolvedValue(run({ status: GauntletRunStatus.ENDED }));

    await service.startRun(
      SESSION_ID,
      startDto({ source: GauntletSource.CURATED, playlistId: undefined }),
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: GauntletSource.CURATED,
        sourceId: null,
      }),
    );
  });

  it('records what the run was started against', async () => {
    await service.startRun(SESSION_ID, startDto());

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: GauntletSource.PLAYLIST,
        sourceId: PLAYLIST,
      }),
    );
  });

  it('starts a curated run for a player with no Spotify account', async () => {
    mockAuthService.getUserBySessionId.mockResolvedValue({
      id: ME,
      spotifyUserId: null,
    });

    await service.startRun(
      SESSION_ID,
      startDto({
        source: GauntletSource.CURATED,
        playlistId: undefined,
        trackGroupId: GROUP,
      }),
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: GauntletSource.CURATED,
        sourceId: GROUP,
      }),
    );
    expect(poolService.pickTrack).toHaveBeenCalled();
  });

  it('records a whole-pool run with no id to narrow it', async () => {
    await service.startRun(
      SESSION_ID,
      startDto({ source: GauntletSource.CURATED, playlistId: undefined }),
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: GauntletSource.CURATED,
        sourceId: null,
      }),
    );
  });

  it('refuses a playlist run from a player who never linked Spotify', async () => {
    mockAuthService.getUserBySessionId.mockResolvedValue({
      id: ME,
      spotifyUserId: null,
    });

    await expect(service.startRun(SESSION_ID, startDto())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('hides a group this player is not meant to have, rather than refusing it', async () => {
    mockAuthService.getUserBySessionId.mockResolvedValue({
      id: ME,
      spotifyUserId: 'spotify-me',
      isTrusted: false,
    });
    trackGroupService.requireById.mockResolvedValue({
      id: GROUP,
      type: TrackGroupType.SPECIAL,
    });

    await expect(
      service.startRun(
        SESSION_ID,
        startDto({
          source: GauntletSource.CURATED,
          playlistId: undefined,
          trackGroupId: GROUP,
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('draws a curated run from the pool, never from a playlist', async () => {
    repo.findById.mockResolvedValue(
      run({ source: GauntletSource.CURATED, sourceId: GROUP }),
    );

    await service.submitGuess(SESSION_ID, RUN_ID, { trackId: 'track-1' });

    expect(poolService.pickTrack).toHaveBeenCalledWith(
      expect.arrayContaining([]),
      GROUP,
    );
    expect(playlistService.getPlaylistFirstTracks).not.toHaveBeenCalled();
  });

  it('draws the next track from the run, not from the request', async () => {
    repo.findById.mockResolvedValue(
      run({ sourceId: 'playlist-the-run-began-on' }),
    );

    await service.submitGuess(SESSION_ID, RUN_ID, { trackId: 'track-1' });

    expect(playlistService.getPlaylistFirstTracks).toHaveBeenCalledWith(
      SESSION_ID,
      'playlist-the-run-began-on',
    );
  });

  it('ends a run whose source was never recorded rather than guessing at one', async () => {
    repo.findById.mockResolvedValue(run({ sourceId: null }));
    repo.endRun.mockResolvedValue(
      run({ status: GauntletRunStatus.ENDED, score: 1 }),
    );

    const result = await service.submitGuess(SESSION_ID, RUN_ID, {
      trackId: 'track-1',
    });

    expect(result.runOver).toBe(true);
    expect(playlistService.getPlaylistFirstTracks).not.toHaveBeenCalled();
  });
});
