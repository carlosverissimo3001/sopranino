import { Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import {
  TRACK_ARTISTS_PREFIX,
  TRACK_ARTISTS_TIMEOUT_MS,
  TRACK_ARTISTS_TTL,
} from '../../consts';

const DEEZER_TRACK_URL = 'https://api.deezer.com/track/';

export interface ArtistLookup {
  id?: string | null;
  isrc?: string | null;
  artistName?: string | null;
}

/**
 * Everybody credited on a recording, not only its main artist: Creepin' is
 * filed under Metro Boomin, and The Weeknd is on it. Deezer's search only
 * returns the main artist, so the rest come from one track lookup, cached for
 * as long as credits reasonably stay the same.
 */
@Injectable()
export class TrackArtistsService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(TrackArtistsService.name);
  }

  /**
   * Never throws and never comes back empty: whatever goes wrong, the main
   * artist is still an answer, and scoring falls back to comparing it alone.
   */
  async artistsOf(track: ArtistLookup): Promise<string[]> {
    const fallback = track.artistName ? [track.artistName] : [];
    const path = this.deezerPath(track);
    if (!path) return fallback;

    const cacheKey = `${TRACK_ARTISTS_PREFIX}${path}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    try {
      const response = await fetch(`${DEEZER_TRACK_URL}${path}`, {
        signal: AbortSignal.timeout(TRACK_ARTISTS_TIMEOUT_MS),
      });
      if (!response.ok) return fallback;

      const body = (await response.json()) as {
        error?: unknown;
        artist?: { name?: string };
        contributors?: { name?: string }[];
      };
      if (body.error) return fallback;

      const names = [
        body.artist?.name,
        ...(body.contributors ?? []).map((contributor) => contributor.name),
      ].filter((name): name is string => !!name);
      const artists = [...new Set([...names, ...fallback])];

      await this.redis.set(
        cacheKey,
        JSON.stringify(artists),
        TRACK_ARTISTS_TTL,
      );
      return artists;
    } catch (error) {
      this.logger.warn(
        `Could not read the artists of ${path}: ${(error as Error).message}`,
      );
      return fallback;
    }
  }

  /** A Deezer id where there is one, else the ISRC, which Deezer also takes. */
  private deezerPath(track: ArtistLookup): string | null {
    const id = track.id?.replace(/^dz:/, '');
    if (id && /^\d+$/.test(id)) return id;
    const isrc = track.isrc?.replace(/[^a-z0-9]/gi, '').toUpperCase();
    return isrc ? `isrc:${isrc}` : null;
  }
}
