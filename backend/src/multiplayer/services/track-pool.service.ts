import { BadRequestException, Injectable } from '@nestjs/common';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { TrackService } from '../../track/services/track.service';
import { SessionService } from '../../auth/services/session.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackDto } from '../../track/dto/track.dto';
import { shuffleInPlace } from '../../game/utils/utils';
import { TrackSource } from '@prisma/client';
import { UserRepository } from '../../auth/repositories/user.repository';
import { PoolService } from '../../pool/services/pool.service';

/** Number of 50-track batches to fetch per player */
const BATCHES_PER_PLAYER = 3;
/** Max preview-resolve attempts per weighted selection pass */
const MAX_PREVIEW_ATTEMPTS = 20;

interface PoolEntry {
  track: TrackDto;
  likedByCount: number;
}

@Injectable()
export class TrackPoolService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly trackService: TrackService,
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
    private readonly poolService: PoolService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(TrackPoolService.name);
  }

  /**
   * Select tracks for a multiplayer room using weighted liked-song pooling.
   *
   * 1. Resolve each player's userId -> sessionId via reverse Redis lookup
   * 2. Fetch liked-song batches for each player
   * 3. Build weighted frequency map (tracks liked by more players → higher weight)
   * 4. Weighted random selection of `roundCount` unique tracks with valid previews
   * 5. Upsert selected tracks to DB
   *
   * @param playerUserIds - DB user IDs (from RoomPlayer)
   * @param roundCount - Number of tracks to select
   * @returns Array of trackIds
   */
  async selectTracksForRoom({
    playerUserIds,
    roundCount,
    trackSource = TrackSource.POOL,
    trackGroupId,
  }: {
    playerUserIds: string[];
    roundCount: number;
    trackSource?: TrackSource;
    /** Required for a set; ignored otherwise. */
    trackGroupId?: string;
  }): Promise<string[]> {
    if (trackSource === TrackSource.POOL) {
      return this.selectFromCuratedPool(roundCount);
    }

    if (trackSource === TrackSource.SET) {
      if (!trackGroupId) {
        throw new BadRequestException('This room has no set to play from');
      }
      return this.selectFromCuratedPool(roundCount, trackGroupId);
    }

    // Only the players who have a library can contribute one. A guest in the
    // room plays against the others' music rather than overriding the host's
    // choice — the host picked this, and nothing should change it under them.
    const linkedUserIds =
      await this.userRepository.filterWithCredential(playerUserIds);

    if (linkedUserIds.length === 0) {
      this.logger.warn(
        'A libraries room has no linked players, falling back to the pool',
      );
      return this.selectFromCuratedPool(roundCount);
    }

    // 1. Resolve userIds -> sessionIds
    const sessionIds = await this.resolvePlayerSessions(linkedUserIds);

    if (sessionIds.length === 0) {
      throw new BadRequestException(
        'No active sessions found for any player in the room',
      );
    }

    // 2. Fetch liked songs for each player and build frequency map
    const pool = await this.buildTrackPool(sessionIds);

    if (pool.size === 0) {
      throw new BadRequestException(
        'No tracks found across any player liked songs',
      );
    }

    // 3. Weighted random selection with preview validation
    const selectedTrackIds = await this.weightedSelect(pool, roundCount);

    return selectedTrackIds;
  }

  /**
   * Draws from the committed pool, which is local, so a room with a guest in it
   * costs nothing upstream to start.
   */
  async selectFromCuratedPool(
    roundCount: number,
    trackGroupId?: string,
  ): Promise<string[]> {
    const trackIds: string[] = [];

    for (let i = 0; i < roundCount; i++) {
      try {
        // A copy: the same array is passed on every draw, and the callee
        // holding onto it would let one round rewrite the next.
        const track = await this.poolService.pickTrack(
          [...trackIds],
          trackGroupId,
        );
        trackIds.push(track.id);
      } catch (err) {
        this.logger.warn(
          `Curated pool exhausted after ${trackIds.length} tracks: ${(err as Error).message}`,
        );
        break;
      }
    }

    if (trackIds.length === 0) {
      throw new BadRequestException('No curated tracks available');
    }

    return trackIds;
  }

  private async resolvePlayerSessions(userIds: string[]): Promise<string[]> {
    // Fetch all users in a single query to avoid N+1 DB calls
    const existingIds = await this.userRepository.findExistingIds(userIds);
    const foundUserIds = new Set(existingIds);

    // Log missing users (present in input but not in DB)
    for (const userId of userIds) {
      if (!foundUserIds.has(userId)) {
        this.logger.warn(`User ${userId} not found, skipping`);
      }
    }

    // Resolve sessions in parallel for found users
    const sessionIdsWithNulls = await Promise.all(
      existingIds.map(async (userId) => {
        const sessionId =
          await this.sessionService.getSessionIdByUserId(userId);

        if (!sessionId) {
          this.logger.warn(`No active session for user ${userId}, skipping`);
          return null;
        }

        return sessionId;
      }),
    );

    // Filter out users without active sessions
    const sessionIds = sessionIdsWithNulls.filter(
      (id): id is string => id !== null,
    );
    return sessionIds;
  }

  private async buildTrackPool(
    sessionIds: string[],
  ): Promise<Map<string, PoolEntry>> {
    const pool = new Map<string, PoolEntry>();

    for (const sessionId of sessionIds) {
      try {
        const tracks = await this.fetchPlayerTracks(sessionId);

        // Deduplicate per session: each player contributes at most +1 per track
        const seenForSession = new Set<string>();

        for (const track of tracks) {
          if (!track.id || seenForSession.has(track.id)) {
            continue;
          }
          seenForSession.add(track.id);

          const existing = pool.get(track.id);
          if (existing) {
            existing.likedByCount++;
          } else {
            pool.set(track.id, { track, likedByCount: 1 });
          }
        }
      } catch (err) {
        this.logger.warn(
          `Failed to fetch tracks for session ${sessionId}: ${(err as Error).message}`,
        );
      }
    }

    return pool;
  }

  private async fetchPlayerTracks(sessionId: string): Promise<TrackDto[]> {
    let metadata;
    try {
      metadata = await this.playlistService.getLikedSongsMetadata(sessionId);
    } catch (err) {
      this.logger.warn(
        `Cannot fetch liked songs metadata: ${(err as Error).message}`,
      );
      return [];
    }

    const total = metadata.totalTracks;
    if (!total) {
      return [];
    }

    // Fetch batches in parallel (same session, different offsets)
    const batchPromises = Array.from({ length: BATCHES_PER_PLAYER }, (_, i) => {
      const offset = Math.floor(Math.random() * Math.max(1, total - 49));
      return this.playlistService
        .getLikedTracksBatch(sessionId, offset)
        .catch((err) => {
          this.logger.warn(
            `Batch ${i} fetch failed: ${(err as Error).message}`,
          );
          return [] as TrackDto[];
        });
    });

    const batches = await Promise.all(batchPromises);
    return batches.flat();
  }

  private async weightedSelect(
    pool: Map<string, PoolEntry>,
    roundCount: number,
  ): Promise<string[]> {
    const selected: string[] = [];

    const entries = [...pool.values()];

    // Keep selecting until we have enough or exhaust options
    const attempted = new Set<string>();

    for (
      let pass = 0;
      selected.length < roundCount && pass < MAX_PREVIEW_ATTEMPTS;
      pass++
    ) {
      const entry = this.pickWeighted(entries, attempted);
      if (!entry) {
        // All entries attempted, break
        break;
      }

      attempted.add(entry.track.id);

      try {
        const withPreview = await this.trackService.getTrackWithPreview(
          entry.track.id,
          entry.track,
        );

        if (withPreview?.previewUrl) {
          selected.push(entry.track.id);
        }
      } catch (err) {
        this.logger.warn(
          `Preview failed for ${entry.track.id}: ${(err as Error).message}`,
        );
      }
    }

    // Fallback: if not enough tracks from weighted pool, try remaining unweighted
    if (selected.length < roundCount) {
      const remaining = entries.filter((e) => !attempted.has(e.track.id));
      shuffleInPlace(remaining);

      let fallbackAttempts = 0;
      for (const entry of remaining) {
        if (
          selected.length >= roundCount ||
          fallbackAttempts >= MAX_PREVIEW_ATTEMPTS
        ) {
          break;
        }
        fallbackAttempts++;

        try {
          const withPreview = await this.trackService.getTrackWithPreview(
            entry.track.id,
            entry.track,
          );

          if (withPreview?.previewUrl) {
            selected.push(entry.track.id);
          }
        } catch (err) {
          this.logger.warn(
            `Fallback preview failed for ${entry.track.id}: ${(err as Error).message}`,
          );
        }
      }
    }

    if (selected.length === 0) {
      throw new BadRequestException(
        'Could not find any tracks with valid preview URLs',
      );
    }

    if (selected.length < roundCount) {
      this.logger.warn(
        `Only found ${selected.length}/${roundCount} tracks with previews`,
      );
    }

    return selected;
  }

  private pickWeighted(
    entries: PoolEntry[],
    exclude: Set<string>,
  ): PoolEntry | null {
    // Filter to only non-excluded entries
    const available = entries.filter((e) => !exclude.has(e.track.id));
    if (available.length === 0) {
      return null;
    }

    const availableWeight = available.reduce(
      (sum, e) => sum + e.likedByCount,
      0,
    );
    let random = Math.random() * availableWeight;

    for (const entry of available) {
      random -= entry.likedByCount;
      if (random <= 0) {
        return entry;
      }
    }

    // Fallback (shouldn't happen, but safety)
    return available[available.length - 1];
  }
}
