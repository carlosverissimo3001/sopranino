import { PlaylistService } from '@/playlist/services/playlist.service';
import { TrackDto } from '@/track/dto/track.dto';
import { TrackRepository } from '@/track/repositories/track.repository';
import { LastfmService } from '@/track/services/lastfm.service';
import { TrackService } from '@/track/services/track.service';
import { AuthService } from '@auth/services/auth.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GameMode, GameStatus } from '@prisma/client';
import { Transactional } from '@transaction/transactional.decorator';
import { formatDate, isAfter, subDays, subHours } from 'date-fns';
import {
  LIKED_SONGS_ID_SUFFIX,
  POOL_MAX_PREVIEW_ATTEMPTS,
  POOL_PLAYLIST_ID,
} from '../../consts';
import { PoolService } from '../../pool/services/pool.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { AppLoggerService } from '../../logger/logger.service';
import { StreakService } from '../../streak/services/streak.service';
import { TrackMetadataVo } from '../../track/vo/track-metadata.vo';
import { UserPreferencesService } from '../../user-preferences/services/user-preferences.service';
import { GuessResult, MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { PlayedTodayDto } from '../dto/daily/played-today.dto';
import { ShareResultDto } from '../dto/daily/share-result.dto';
import {
  GameHistoryDto,
  GameHistoryEntryDto,
  StreakFreezeUsageDto,
} from '../dto/game-history.dto';
import { GameStateDto } from '../dto/game-state.dto';
import { StartGameDto } from '../dto/game/start-game.dto';
import { GetHistoryDto } from '../dto/get-history.dto';
import { paginate } from '../../utils/pagination/paginate';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { GuessResultDto } from '../dto/guess/guess-result.dto';
import { GuessDto } from '../dto/guess/guess.dto';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GetStatsDto } from '../dto/stats/get-stats.dto';
import { GameSessionRepository } from '../repositories/game-session.repository';
import {
  mapInitialGameState,
  mapToGameStateDto,
} from '../utils/game-state-mapper';
import {
  addGuessToHistory,
  calculateNextState,
  evaluateGuess,
} from '../utils/guess-evaluator';
import { buildHintsForRound } from '../utils/hint-builder';
import { buildShareText, guessToEmoji } from '../utils/share.utils';
import {
  formatUtcDay,
  gameNumberFromDate,
  shuffleInPlace,
} from '../utils/utils';
import { GameStatsService } from './game-stats.service';
import { TrackGroupService } from '../../track-group/services/track-group.service';
import { DailyTrackService } from '../../daily/services/daily-track.service';

@Injectable()
export class GameService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly trackService: TrackService,
    private readonly trackRepository: TrackRepository,
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly authService: AuthService,
    private readonly gameStatsService: GameStatsService,
    private readonly streakService: StreakService,
    private readonly lastfmService: LastfmService,
    private readonly poolService: PoolService,
    private readonly dailyTrackService: DailyTrackService,
    private readonly trackGroupService: TrackGroupService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(GameService.name);
  }

  @Transactional()
  async startGame(
    sessionId: string,
    params: StartGameDto,
  ): Promise<GameStateDto> {
    const { playlistId, trackGroupId, mode } = params;
    const user = await this.authService.getUserBySessionId(sessionId);
    const userId = user.id;

    const userTimezone =
      await this.userPreferencesService.getUserTimezone(userId);

    // A group and the wider pool are both stored under the sentinel playlist,
    // so the group id is the only thing that tells two of them apart.
    const isPool = !!trackGroupId || playlistId === POOL_PLAYLIST_ID;
    const storedPlaylistId = isPool ? POOL_PLAYLIST_ID : playlistId;

    if (mode !== GameMode.DAILY && !storedPlaylistId) {
      throw new BadRequestException('Playlist ID is required');
    }

    const existing =
      mode === GameMode.DAILY
        ? await this.gameSessionRepository.findTodayDailySession(
            userId,
            userTimezone,
          )
        : await this.gameSessionRepository.findActiveSession(
            userId,
            mode,
            storedPlaylistId!,
            trackGroupId ?? null,
          );

    // If there's an active session (or already played daily) for this user and mode,
    // return it instead of starting a new one
    if (existing) {
      return this.getGameState(sessionId, existing.id);
    }

    // The daily is one song a day for everyone, so it never looks at whose
    // library this is.
    if (mode === GameMode.DAILY) {
      return this.startDailyGame(userId);
    }

    // A group is the pool narrowed to a set someone chose, so it takes the
    // same path and ends up indistinguishable from any other round.
    if (trackGroupId) {
      const group = await this.trackGroupService.requireById(trackGroupId);

      // Listing hides a group this player is not meant to have; starting one
      // has to say so too, or the id is the only thing keeping them out.
      if (!TrackGroupService.isVisible(group.type, user)) {
        throw new NotFoundException(`No track group ${trackGroupId}`);
      }

      return this.startPoolGame(userId, mode, trackGroupId);
    }

    if (playlistId === POOL_PLAYLIST_ID) {
      return this.startPoolGame(userId, mode);
    }

    const targetPlaylistId = storedPlaylistId!;

    const { selectedTrack, previewUrl } = await this.resolveTrackWithPreview(
      sessionId,
      targetPlaylistId,
    );

    const metadata = await this.fetchOrReuseMetadata(
      selectedTrack.id,
      selectedTrack.name,
      selectedTrack.primaryArtist,
    );

    await this.trackRepository.upsertTrack(selectedTrack.id, {
      name: selectedTrack.name,
      artistName: selectedTrack.primaryArtist,
      albumImageUrl: selectedTrack.imageUrl,
      albumName: selectedTrack.albumName,
      albumUrl: `https://open.spotify.com/album/${selectedTrack.albumId}`,
      releaseYear: selectedTrack.releaseYear,
      isrc: selectedTrack.isrc,
      previewUrl,
      metadata,
      allArtists: selectedTrack.allArtists,
    });

    const game = await this.gameSessionRepository.createSession({
      user: { connect: { id: userId } },
      playlistId: targetPlaylistId,
      mode,
      track: { connect: { id: selectedTrack.id } },
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
    });

    return mapInitialGameState(game.id, previewUrl);
  }

  /**
   * The same track for everyone on the same UTC day. Whether the player has a
   * Spotify library makes no difference, which is what lets a result be
   * compared at all.
   */
  private async startDailyGame(userId: string): Promise<GameStateDto> {
    const track = await this.dailyTrackService.today();
    const previewUrl = await this.trackService.resolvePreview(track);
    if (!previewUrl) {
      throw new BadRequestException(
        "Today's track has no preview audio right now.",
      );
    }

    const game = await this.gameSessionRepository.createSession({
      user: { connect: { id: userId } },
      playlistId: POOL_PLAYLIST_ID,
      mode: GameMode.DAILY,
      track: { connect: { id: track.id } },
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
    });

    return mapInitialGameState(game.id, previewUrl);
  }

  /** No Spotify library to draw from, so the round comes out of the pool. */
  private async startPoolGame(
    userId: string,
    mode: GameMode,
    trackGroupId?: string,
  ): Promise<GameStateDto> {
    const { track, previewUrl } =
      await this.pickPoolTrackWithPreview(trackGroupId);

    const game = await this.gameSessionRepository.createSession({
      user: { connect: { id: userId } },
      playlistId: POOL_PLAYLIST_ID,
      trackGroupId,
      mode,
      track: { connect: { id: track.id } },
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
    });

    return mapInitialGameState(game.id, previewUrl);
  }

  /**
   * Pool rows carry no preview: Deezer's links expire within minutes, so audio
   * is resolved per round. A track that resolves to nothing is set aside and
   * another drawn, rather than failing the round.
   */
  private async pickPoolTrackWithPreview(trackGroupId?: string): Promise<{
    track: TrackEntity;
    previewUrl: string;
  }> {
    const tried: string[] = [];

    for (let i = 0; i < POOL_MAX_PREVIEW_ATTEMPTS; i++) {
      const track = await this.poolService.pickTrack(tried, trackGroupId);
      try {
        const previewUrl = await this.trackService.resolvePreview(track);
        if (previewUrl) {
          return { track, previewUrl };
        }
      } catch (err) {
        this.logger.warn(
          `Preview failed for ${track.id}: ${(err as Error).message}`,
        );
      }
      tried.push(track.id);
    }

    throw new BadRequestException(
      'No tracks with preview audio in the pool right now.',
    );
  }

  private async resolveTrackWithPreview(sessionId: string, playlistId: string) {
    if (playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)) {
      return this.pickLikedTrackWithPreview(sessionId);
    }
    return this.pickPlaylistTrackWithPreview(sessionId, playlistId);
  }

  /**
   * Liked Songs: batch-first approach.
   * Fetches 50 tracks at a random offset (cached for 5 hours), shuffles, and picks one with preview.
   * Falls back to a second batch if the first yields nothing (very rare).
   */
  private async pickLikedTrackWithPreview(
    sessionId: string,
  ): Promise<{ selectedTrack: TrackDto; previewUrl: string }> {
    const { totalTracks: total } =
      await this.playlistService.getLikedSongsMetadata(sessionId);
    if (!total) {
      throw new BadRequestException('Liked Songs is empty');
    }

    const maxBatches = 2;
    for (let batch = 0; batch < maxBatches; batch++) {
      const batchOffset = Math.floor(Math.random() * Math.max(1, total - 49));
      const tracks = await this.playlistService.getLikedTracksBatch(
        sessionId,
        batchOffset,
      );

      const playable = tracks.filter((t) => t.id);
      if (!playable.length) {
        continue;
      }

      const shuffled = [...playable];
      shuffleInPlace(shuffled);
      const maxAttempts = Math.min(10, shuffled.length);

      for (let i = 0; i < maxAttempts; i++) {
        const track = shuffled[i];
        try {
          const withPreview = await this.trackService.getTrackWithPreview(
            track.id,
            track,
          );
          if (withPreview?.previewUrl) {
            return { selectedTrack: track, previewUrl: withPreview.previewUrl };
          }
        } catch (err) {
          this.logger.warn(
            `Preview failed for ${track.id}: ${(err as Error).message}`,
          );
        }
      }
    }

    throw new BadRequestException(
      'No tracks with preview audio in Liked Songs.',
    );
  }

  /** Regular playlist: get first batch, shuffle, try until we find one with preview. */
  private async pickPlaylistTrackWithPreview(
    sessionId: string,
    playlistId: string,
  ): Promise<{ selectedTrack: TrackDto; previewUrl: string }> {
    const tracks = await this.playlistService.getPlaylistFirstTracks(
      sessionId,
      playlistId,
    );
    if (!tracks.length) {
      throw new BadRequestException('Playlist is empty');
    }
    // This happens if the user added local files to the playlist (or songs that are no longer available on Spotify)
    const playable = tracks.filter((t) => t.id);
    if (!playable.length) {
      throw new BadRequestException('No playable tracks in playlist');
    }

    const shuffled = [...playable].sort(() => Math.random() - 0.5);
    const maxAttempts = Math.min(10, shuffled.length);
    for (let i = 0; i < maxAttempts; i++) {
      const track = shuffled[i];
      try {
        const withPreview = await this.trackService.getTrackWithPreview(
          track.id,
          track,
        );
        if (withPreview?.previewUrl) {
          return { selectedTrack: track, previewUrl: withPreview.previewUrl };
        }
      } catch (err) {
        this.logger.warn(
          `Preview failed for ${track.id}: ${(err as Error).message}`,
        );
      }
    }
    throw new BadRequestException(
      'No tracks with preview audio in this playlist.',
    );
  }

  /**
   * Get current game state
   * @param sessionId - The session ID of the requesting user
   * @param gameSessionId - The ID of the game session
   */
  async getGameState(
    sessionId: string,
    gameSessionId: string,
  ): Promise<GameStateDto> {
    const [user, game] = await Promise.all([
      this.authService.getUserBySessionId(sessionId),
      this.gameSessionRepository.findByIdWithTrack(gameSessionId),
    ]);

    if (!game || !game.userId) {
      throw new NotFoundException('Game session not found');
    }

    if (game.userId !== user.id) {
      throw new NotFoundException('Game session not found');
    }

    if (!game.track) {
      throw new NotFoundException('Associated track not found');
    }

    // Should not happen since we only start games with valid tracks, but just in case
    const previewUrl = await this.trackService.playableUrl(game.track);
    if (!previewUrl) {
      throw new NotFoundException('Track not found or no preview URL');
    }

    return mapToGameStateDto(game, { ...game.track, previewUrl });
  }

  @Transactional()
  async submitGuess(
    sessionId: string,
    gameSessionId: string,
    guess: GuessDto,
  ): Promise<GuessResultDto> {
    const [user, game] = await Promise.all([
      this.authService.getUserBySessionId(sessionId),
      this.gameSessionRepository.findByIdWithTrack(gameSessionId),
    ]);

    if (!game || !game.userId) {
      throw new NotFoundException('Game session not found');
    }

    if (game.userId !== user.id) {
      throw new NotFoundException('Game session not found');
    }

    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is already over');
    }

    if (!game.track) {
      throw new NotFoundException('Associated track not found');
    }

    const result = evaluateGuess(guess, game.track);

    const updatedGuesses = addGuessToHistory(
      game.guesses as unknown as GuessHistoryDto[],
      result,
      game.track,
      guess,
    );
    const nextRound = game.currentRound + 1;
    const { status, gameOver } = calculateNextState(result, nextRound);

    if (gameOver && game.userId) {
      const lastGameRound =
        result === GuessResult.Correct ? game.currentRound : nextRound;

      await this.gameStatsService.recordFinishedGame({
        userId: game.userId,
        lastGameRound,
        mode: game.mode,
      });
    }

    await this.gameSessionRepository.updateSessionProgress(gameSessionId, {
      currentRound: nextRound,
      guesses: updatedGuesses,
      status,
      completedAt: gameOver ? new Date() : undefined,
    });

    const hints =
      !gameOver && game.track.previewUrl
        ? buildHintsForRound(game.track, nextRound)
        : undefined;

    return {
      result,
      gameOver,
      status,
      currentRound: nextRound,
      snippetDuration: ROUND_DURATIONS[Math.min(nextRound, MAX_ROUNDS - 1)],
      maxRounds: MAX_ROUNDS,
      hints,
    };
  }

  /**
   * Returns existing metadata if fresh (<30 days), otherwise fetches from Last.fm.
   */
  private async fetchOrReuseMetadata(
    trackId: string,
    trackName: string,
    artistName: string,
  ): Promise<TrackMetadataVo> {
    const existing = await this.trackRepository.findById(trackId);
    const meta = existing?.metadata ?? {};

    if (meta.lastfm?.fetchedAt) {
      const thirtyDaysAgo = subDays(new Date(), 30);
      if (isAfter(new Date(meta.lastfm.fetchedAt), thirtyDaysAgo)) {
        return meta;
      }
    }

    const lastfm = await this.lastfmService.getTrackInfo(trackName, artistName);

    return lastfm ? { ...meta, lastfm } : meta;
  }

  async getHistory(
    sessionId: string,
    dto: GetHistoryDto,
  ): Promise<GameHistoryDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const { items, total } =
      await this.gameSessionRepository.findUserGameSessions({
        userId,
        ...dto,
        // In the history tab, we don't care about incomplete games
        onlyCompleted: true,
      });

    const trackIds = [...new Set(items.map((s) => s.trackId))];
    const tracks = await this.trackRepository.findMany(trackIds);
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    const entries: GameHistoryEntryDto[] = items.map((s) => {
      const track = trackMap.get(s.trackId);
      const dateSource = s.completedAt ?? s.createdAt;
      return {
        id: s.id,
        date: formatDate(dateSource, 'yyyy-MM-dd'),
        status: s.status,
        score: s.score,
        mode: s.mode,
        guesses: s.guesses,
        trackName: track?.name ?? '',
        artistName: track?.artistName ?? '',
        albumImageUrl: track?.albumImageUrl ?? undefined,
      };
    });

    // For DAILY mode, include streak freeze usages scoped to the page date range
    let streakFreezeUsages: StreakFreezeUsageDto[] | undefined;
    if (dto.mode === GameMode.DAILY && entries.length > 0) {
      const pageDates = entries.map((e) => e.date);
      const oldestDate = pageDates[pageDates.length - 1]; // sorted desc, last = oldest
      const newestDate = pageDates[0];

      const usages = await this.streakService.getFreezeUsagesInRange(
        userId,
        oldestDate,
        newestDate,
      );
      streakFreezeUsages = usages.map((u) => ({
        id: u.id,
        coveredFrom: formatDate(u.coveredFrom, 'yyyy-MM-dd'),
        coveredTo: formatDate(u.coveredTo, 'yyyy-MM-dd'),
        freezesUsed: u.freezesUsed,
        gapDays: u.gapDays,
        streakAtTime: u.streakAtTime,
      }));
    }

    return {
      ...paginate(entries, total, dto),
      streakFreezeUsages,
    };
  }

  async getStats(
    sessionId: string,
    params: GetStatsDto,
  ): Promise<GameStatsDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    return this.gameStatsService.getStats(userId, params.mode);
  }

  async getPlayedToday(sessionId: string): Promise<PlayedTodayDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const timezone = await this.userPreferencesService.getUserTimezone(userId);
    const todaySession = await this.gameSessionRepository.findTodayDailySession(
      userId,
      timezone,
    );
    return { playedToday: !!todaySession?.completedAt };
  }

  async getShare(sessionId: string, gameId: string): Promise<ShareResultDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const game = await this.gameSessionRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game session not found');
    }
    if (game.userId !== userId) {
      throw new NotFoundException('Game session not found');
    }
    if (game.status === GameStatus.PLAYING) {
      throw new BadRequestException('Game not completed');
    }

    const guesses = game.guesses;
    const guessPattern = guesses.map((g) => guessToEmoji(g.result)).join('');
    const isWin = game.status === GameStatus.WON;

    const dateSource = game.completedAt ?? game.createdAt;
    const gameNum = gameNumberFromDate(dateSource);
    // FRONTEND_URL, not an APP_URL of its own: CORS already refuses every
    // request unless it is set, so it cannot be missing in a deployment that
    // works, and a share link is worthless if it points somewhere else.
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareText = buildShareText({
      gameNumber: gameNum,
      isWin,
      guesses,
      appUrl,
    });

    const track = await this.trackRepository.findById(game.trackId);

    return {
      date: formatUtcDay(dateSource),
      attempts: isWin ? guesses.length : MAX_ROUNDS,
      guessPattern,
      trackName: track?.name ?? '',
      artistName: track?.artistName ?? '',
      shareText,
      gameNumber: gameNum,
    };
  }

  /**
   * Marks games as abandoned if they've been in PLAYING state for over an hour, to keep the system clean of forgotten sessions.
   * This is triggered by a scheduled job in GameConsumer.
   * Daily games should be ignored
   * @returns
   */
  async cleanupAbandonedGames(): Promise<number> {
    const oneHourAgo = subHours(new Date(), 1);

    const games = await this.gameSessionRepository.updateMany(
      {
        status: GameStatus.PLAYING,
        createdAt: { lt: oneHourAgo },
        mode: { not: GameMode.DAILY },
      },
      {
        status: GameStatus.ABANDONED,
      },
    );

    return games;
  }
}
