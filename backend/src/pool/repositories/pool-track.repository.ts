import { Injectable } from '@nestjs/common';
import { TrackGroupType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

export interface PoolCandidate {
  id: string;
  fame: number;
  year: number;
}

@Injectable()
export class PoolTrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every track that may be picked, with what the weighting needs. Three
   * columns of a few thousand rows, so this is cheap enough to
   * read per round and lets the weighting live in code rather than in SQL.
   */
  async findCandidates(
    excludeIds: string[] = [],
    trackGroupId?: string,
  ): Promise<PoolCandidate[]> {
    // Both narrow the same column, so they go in one filter: as separate keys
    // the second would silently replace the first.
    const id: { in?: string[]; notIn?: string[] } = {};

    if (excludeIds.length > 0) {
      id.notIn = excludeIds;
    }

    if (trackGroupId) {
      const members = await this.prisma.trackGroupTrack.findMany({
        where: { trackGroupId },
        select: { trackId: true },
      });
      id.in = members.map((member) => member.trackId);
    }

    return this.prisma.poolTrack.findMany({
      where: {
        ...(Object.keys(id).length > 0 && { id }),
        ...(trackGroupId ? {} : { groupOnly: false }),
      },
      select: { id: true, fame: true, year: true },
    });
  }

  /**
   * The shuffle pool's fame, for the tier scale. Group-only songs stay out: an
   * artist's B-sides or this week's charts would otherwise move every set's cuts.
   */
  async findAllFame(): Promise<number[]> {
    const rows = await this.prisma.poolTrack.findMany({
      where: { groupOnly: false },
      select: { fame: true },
    });
    return rows.map((row) => row.fame);
  }

  async findGroupType(trackGroupId: string): Promise<TrackGroupType | null> {
    const group = await this.prisma.trackGroup.findUnique({
      where: { id: trackGroupId },
      select: { type: true },
    });
    return group?.type ?? null;
  }

  async count(): Promise<number> {
    return this.prisma.poolTrack.count();
  }

  async stats(): Promise<{
    total: number;
    firstYear: number | null;
    lastYear: number | null;
    refreshedAt: Date | null;
  }> {
    const [total, years, refreshed] = await Promise.all([
      this.prisma.poolTrack.count(),
      this.prisma.poolTrack.aggregate({
        _min: { year: true },
        _max: { year: true },
      }),
      this.prisma.poolTrack.aggregate({ _max: { refreshedAt: true } }),
    ]);

    return {
      total,
      firstYear: years._min.year,
      lastYear: years._max.year,
      refreshedAt: refreshed._max.refreshedAt,
    };
  }
}
