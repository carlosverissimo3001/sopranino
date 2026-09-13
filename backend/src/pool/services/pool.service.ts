import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackRepository } from '../../track/repositories/track.repository';
import {
  PoolCandidate,
  PoolTrackRepository,
} from '../repositories/pool-track.repository';
import {
  FIRST_GAME_FAME_SHARE,
  POOL_CANDIDATE_CACHE_MS,
} from '../../consts';
import { mostFamous } from '../utils/most-famous';
import { weightedPick } from '../utils/weighted-pick';

@Injectable()
export class PoolService {
  /**
   * The candidate list only changes when the pool is reseeded, so it is held
   * in memory rather than fetched per round. Exclusions are applied here
   * instead of in the query, which would make the cache useless.
   *
   * Keyed by group: one shared list would hand the next caller whichever
   * decade the last one asked for.
   */
  private cache = new Map<string, { candidates: PoolCandidate[]; at: number }>();

  constructor(
    private readonly poolTrackRepository: PoolTrackRepository,
    private readonly trackRepository: TrackRepository,
  ) {}

  /**
   * @param excludeIds tracks already used in this session, so a round doesn't
   * repeat a song the player just heard.
   */
  async pickTrack(
    excludeIds: string[] = [],
    trackGroupId?: string,
    { famousOnly = false }: { famousOnly?: boolean } = {},
  ): Promise<TrackEntity> {
    const candidates = await this.getCandidates(trackGroupId);
    const exclude = new Set(excludeIds);
    // Falls back to the whole list once every famous candidate has been tried.
    const id =
      (famousOnly &&
        weightedPick(mostFamous(candidates, FIRST_GAME_FAME_SHARE), exclude)) ||
      weightedPick(candidates, exclude);
    if (!id) {
      throw new NotFoundException(
        trackGroupId
          ? `No track available in group ${trackGroupId}`
          : 'No guest track available',
      );
    }

    // The seed writes a `tracks` row for every pool entry, so this is a hit
    // unless the two tables have drifted.
    const track = await this.trackRepository.findById(id);
    if (!track) {
      throw new NotFoundException(`Pool track ${id} is missing from tracks`);
    }
    return track;
  }

  async isReady(): Promise<boolean> {
    return (await this.getCandidates()).length > 0;
  }

  /** Drops every cached list, for when the pool or a group has been rewritten. */
  clearCache(): void {
    this.cache.clear();
  }

  async stats() {
    return this.poolTrackRepository.stats();
  }

  private async getCandidates(
    trackGroupId?: string,
  ): Promise<PoolCandidate[]> {
    const key = trackGroupId ?? '';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < POOL_CANDIDATE_CACHE_MS) {
      return cached.candidates;
    }

    const candidates = await this.poolTrackRepository.findCandidates(
      [],
      trackGroupId,
    );
    this.cache.set(key, { candidates, at: Date.now() });
    return candidates;
  }
}
