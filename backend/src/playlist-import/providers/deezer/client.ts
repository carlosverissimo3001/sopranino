import { Injectable } from '@nestjs/common';
import { DEEZER_API, DEEZER_PACE_MS, DEEZER_QUOTA_ERROR } from '../../consts';
import type {
  DeezerPlaylist,
  DeezerPlaylistTrack,
  DeezerResult,
} from './types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class DeezerClient {
  /**
   * Deezer answers 200 with an error body when it is throttling, so only that
   * code and network failures are retried; any other error is the answer.
   */
  async get<T>(path: string, attempts = 4): Promise<DeezerResult<T>> {
    let code: number | undefined;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await fetch(`${DEEZER_API}${path}`, {
          headers: { 'Accept-Language': 'en' },
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          const body = (await response.json()) as T & {
            error?: { code?: number };
          };
          await sleep(DEEZER_PACE_MS);
          if (!body?.error) {
            return { ok: true, body };
          }
          code = body.error.code;
          if (code !== DEEZER_QUOTA_ERROR) {
            return { ok: false, code };
          }
        }
      } catch {
        // Falls through to the backoff below.
      }
      await sleep(1000 * (attempt + 1));
    }
    return { ok: false, code };
  }

  async playlist(id: string): Promise<DeezerResult<DeezerPlaylist>> {
    return this.get<DeezerPlaylist>(`/playlist/${id}`);
  }

  async playlistTracks(
    id: string,
    max: number,
  ): Promise<DeezerResult<DeezerPlaylistTrack[]>> {
    const tracks: DeezerPlaylistTrack[] = [];
    const pageSize = Math.min(max, 100);

    while (tracks.length < max) {
      const page = await this.get<{
        data?: DeezerPlaylistTrack[];
        next?: string;
      }>(`/playlist/${id}/tracks?limit=${pageSize}&index=${tracks.length}`);
      if (!page.ok) {
        return page;
      }
      tracks.push(...(page.body.data ?? []));
      if (!page.body.next || !page.body.data?.length) {
        break;
      }
    }

    return { ok: true, body: tracks.slice(0, max) };
  }

  async releaseYear(trackId: number): Promise<number> {
    const track = await this.get<{ release_date?: string }>(
      `/track/${trackId}`,
    );
    const year = Number(track.ok && track.body.release_date?.slice(0, 4));
    return Number.isFinite(year) && year > 1900
      ? year
      : new Date().getFullYear();
  }
}
