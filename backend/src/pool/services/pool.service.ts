import { Injectable, NotFoundException } from '@nestjs/common';
import { FameTier } from '@prisma/client';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackRepository } from '../../track/repositories/track.repository';
import {
  PoolCandidate,
  PoolTrackRepository,
} from '../repositories/pool-track.repository';
import { POOL_CANDIDATE_CACHE_MS } from '../../consts';
import { tierCuts, tierFallback, tierOf } from '../utils/fame-tier';
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
  private cuts: { values: number[]; at: number } | null = null;

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
    { tier }: { tier?: FameTier } = {},
  ): Promise<TrackEntity> {
    const candidates = await this.getCandidates(trackGroupId);
    const exclude = new Set(excludeIds);
    const id = tier
      ? await this.pickInTier(candidates, tier, exclude)
      : weightedPick(candidates, exclude);
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

  /** A set can run out of a tier, so the nearest one stands in rather than failing. */
  private async pickInTier(
    candidates: PoolCandidate[],
    tier: FameTier,
    exclude: ReadonlySet<string>,
  ): Promise<string | null> {
    const cuts = await this.getCuts();
    for (const fallback of tierFallback(tier)) {
      const id = weightedPick(
        candidates.filter((c) => tierOf(c.fame, cuts) === fallback),
        exclude,
      );
      if (id) return id;
    }
    return null;
  }

  candidates(trackGroupId?: string): Promise<PoolCandidate[]> {
    return this.getCandidates(trackGroupId);
  }

  async isReady(): Promise<boolean> {
    return (await this.getCandidates()).length > 0;
  }

  /** Drops every cached list, for when the pool or a group has been rewritten. */
  clearCache(): void {
    this.cache.clear();
    this.cuts = null;
  }

  async stats() {
    return this.poolTrackRepository.stats();
  }

  private async getCuts(): Promise<number[]> {
    if (this.cuts && Date.now() - this.cuts.at < POOL_CANDIDATE_CACHE_MS) {
      return this.cuts.values;
    }
    const values = tierCuts(await this.poolTrackRepository.findAllFame());
    this.cuts = { values, at: Date.now() };
    return values;
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
