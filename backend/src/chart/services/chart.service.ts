import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';
import { CHARTS, CHART_PACE_MS, type ChartSource } from '../chart.constants';
import {
  ChartRepository,
  type ChartMember,
} from '../repositories/chart.repository';

const DEEZER = 'https://api.deezer.com';

interface DeezerPlaylistTrack {
  id?: number;
  title?: string;
  isrc?: string;
  rank?: number;
  preview?: string;
  artist?: { name?: string };
  album?: {
    id?: number;
    title?: string;
    cover_xl?: string;
    cover_big?: string;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ChartService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly repository: ChartRepository,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(ChartService.name);
  }

  /** Refreshes every chart. Called by the scheduled job. */
  async refreshAll(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const failed: string[] = [];

    // Sequential rather than parallel: five charts against a rate-limited API
    // is not worth the concurrency, and a throttle costs the whole refresh.
    for (const chart of CHARTS) {
      try {
        const written = await this.refresh(chart);
        results[chart.slug] = written;
        if (written === 0) {
          failed.push(chart.slug);
        }
      } catch (error) {
        this.logger.warn(
          `Refresh failed for ${chart.slug}: ${(error as Error).message}`,
        );
        results[chart.slug] = 0;
        failed.push(chart.slug);
      }
    }

    if (failed.length) {
      // Throwing is what engages the queue's backoff. Retrying re-fetches the
      // charts that already succeeded, which is harmless: replaceChart is a
      // whole replacement inside a transaction.
      this.logger.error(
        `Chart refresh incomplete, retrying: ${JSON.stringify(results)}`,
      );
      throw new Error(`Chart refresh failed for: ${failed.join(', ')}`);
    }

    this.logger.log(`Chart refresh complete: ${JSON.stringify(results)}`);
    return results;
  }

  private async refresh(chart: ChartSource): Promise<number> {
    const body = await this.deezer<{ data?: DeezerPlaylistTrack[] }>(
      `${DEEZER}/playlist/${chart.playlistId}/tracks?limit=100`,
    );
    // No ISRC means no way to tell whether the pool already holds the song,
    // and the pool is deduped by ISRC. Better dropped than entered twice.
    const raw = (body?.data ?? [])
      .filter((track) => track.id && track.preview)
      .map((track) => ({
        ...track,
        normIsrc: (track.isrc ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase(),
      }))
      .filter((track) => track.normIsrc);

    if (!raw.length) {
      this.logger.warn(`No tracks for ${chart.slug}; keeping the previous set`);
      return 0;
    }

    const existing = await this.repository.poolIdsByIsrc(
      raw.map((track) => track.normIsrc),
    );

    const members: ChartMember[] = [];
    const seen = new Set<string>();

    for (const track of raw) {
      // The pool canonicalises to the most-streamed upload, so the chart's copy
      // of a song it already holds has a different id and the same ISRC. The
      // entry plays as the row the pool already has.
      const poolId = existing.get(track.normIsrc);
      const trackId = poolId ?? `dz:${track.id}`;

      // A chart can list two uploads of one song; the group holds it once.
      if (seen.has(trackId)) {
        continue;
      }
      seen.add(trackId);

      if (poolId) {
        members.push({ trackId });
        continue;
      }

      // A year costs a request, and only a song the pool has never seen needs
      // one asked for.
      members.push({
        trackId,
        create: {
          isrc: track.normIsrc,
          name: track.title ?? '',
          artistName: track.artist?.name ?? '',
          albumName: track.album?.title ?? '',
          albumUrl: `https://www.deezer.com/album/${track.album?.id}`,
          albumImageUrl: track.album?.cover_xl ?? track.album?.cover_big,
          fame: track.rank ?? 0,
          year: await this.releaseYear(track.id!),
        },
      });
    }

    return this.repository.replaceChart(
      { slug: chart.slug, name: chart.name },
      members,
    );
  }

  /** Whether a refresh should run at boot rather than waiting for Monday. */
  async needsSeeding(): Promise<boolean> {
    const counts = await Promise.all(
      CHARTS.map((chart) => this.repository.countMembers(chart.name)),
    );
    return counts.some((count) => count === 0);
  }

  private async releaseYear(trackId: number): Promise<number> {
    const track = await this.deezer<{ release_date?: string }>(
      `${DEEZER}/track/${trackId}`,
    );
    const year = Number(track?.release_date?.slice(0, 4));
    return Number.isFinite(year) && year > 1900
      ? year
      : new Date().getFullYear();
  }

  /**
   * Deezer answers 200 with an error body when it is throttling, so a missing
   * payload is not the same as an empty result.
   */
  private async deezer<T>(url: string, attempts = 4): Promise<T | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          const body = (await response.json()) as T & {
            error?: Record<string, unknown>;
          };
          if (!body?.error) {
            await sleep(CHART_PACE_MS);
            return body;
          }
        }
      } catch {
        // Falls through to the backoff below.
      }
      await sleep(1000 * (attempt + 1));
    }
    return null;
  }
}
