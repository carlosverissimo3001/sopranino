import { Injectable } from '@nestjs/common';
import { TrackGroup, TrackGroupType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

export interface TrackGroupSummary extends TrackGroup {
  trackCount: number;
}

@Injectable()
export class TrackGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlugWithCount(slug: string): Promise<TrackGroupSummary | null> {
    const group = await this.prisma.trackGroup.findUnique({
      where: { slug },
      include: { _count: { select: { tracks: true } } },
    });
    if (!group) {
      return null;
    }

    const { _count, ...rest } = group;
    return { ...rest, trackCount: _count.tracks };
  }

  findById(id: string): Promise<TrackGroup | null> {
    return this.prisma.trackGroup.findUnique({ where: { id } });
  }

  /**
   * Empty groups are left out rather than rendered: a tile that cannot be
   * played is worse than no tile.
   */
  async listWithCounts(type: TrackGroupType): Promise<TrackGroupSummary[]> {
    const groups = await this.prisma.trackGroup.findMany({
      where: { type },
      orderBy: { name: 'asc' },
      include: { _count: { select: { tracks: true } } },
    });

    return groups
      .filter((group) => group._count.tracks > 0)
      .map(({ _count, ...group }) => ({
        ...group,
        trackCount: _count.tracks,
      }));
  }

  async replaceTracks(trackGroupId: string, trackIds: string[]): Promise<void> {
    await this.prisma.trackGroupTrack.deleteMany({ where: { trackGroupId } });
    await this.prisma.trackGroupTrack.createMany({
      data: trackIds.map((trackId) => ({ trackId, trackGroupId })),
      skipDuplicates: true,
    });
  }

  async isMember(userId: string, trackGroupId: string): Promise<boolean> {
    const member = await this.prisma.trackGroupMember.findUnique({
      where: { userId_trackGroupId: { userId, trackGroupId } },
      select: { userId: true },
    });
    return !!member;
  }

  /** The ids in a group that are also in the pool, which is what guests play. */
  async trackIdsInPool(groupId: string): Promise<string[]> {
    const rows = await this.prisma.trackGroupTrack.findMany({
      where: { trackGroupId: groupId },
      select: { trackId: true },
    });
    return rows.map((row) => row.trackId);
  }
}
