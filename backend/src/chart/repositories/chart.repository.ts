import { Injectable } from '@nestjs/common';
import { TrackGroupType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

/** What a chart entry needs when the pool has never seen the song. */
export interface NewPoolTrack {
  isrc: string;
  name: string;
  artistName: string;
  albumName: string;
  albumUrl: string;
  albumImageUrl?: string;
  /** Deezer's rank, which is what fame means everywhere else in the pool. */
  fame: number;
  year: number;
}

export interface ChartMember {
  /**
   * The pool row this entry plays as. For a song already in the pool that is
   * its existing id, which is often a different upload from the one the chart
   * links: the pool canonicalises to the most-streamed recording.
   */
  trackId: string;
  /** Absent when the song is already in the pool. */
  create?: NewPoolTrack;
}

@Injectable()
export class ChartRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pool rows keyed by ISRC. The pool is ISRC-deduped on purpose, so this is
   * what tells a chart entry it is a song the pool already holds under
   * another id.
   */
  async poolIdsByIsrc(isrcs: string[]): Promise<Map<string, string>> {
    const rows = await this.prisma.poolTrack.findMany({
      where: { isrc: { in: isrcs } },
      select: { id: true, isrc: true },
    });
    return new Map(rows.map((row) => [row.isrc, row.id]));
  }

  /**
   * One chart, replaced whole. A retry re-runs the same work rather than
   * layering last week's tracks under this week's.
   */
  async replaceChart(
    chart: { slug: string; name: string; imageUrl?: string },
    members: ChartMember[],
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.trackGroup.upsert({
        where: { type_name: { type: TrackGroupType.CHART, name: chart.name } },
        create: {
          type: TrackGroupType.CHART,
          name: chart.name,
          slug: chart.slug,
          imageUrl: chart.imageUrl,
        },
        update: {
          slug: chart.slug,
          ...(chart.imageUrl && { imageUrl: chart.imageUrl }),
        },
      });

      for (const member of members) {
        if (!member.create) {
          continue;
        }
        const track = member.create;

        await tx.track.upsert({
          where: { id: member.trackId },
          create: {
            id: member.trackId,
            name: track.name,
            artistName: track.artistName,
            albumName: track.albumName,
            albumUrl: track.albumUrl,
            albumImageUrl: track.albumImageUrl,
            isrc: track.isrc,
          },
          update: { albumImageUrl: track.albumImageUrl },
        });

        // Only ever created. A song the pool already holds keeps its own year,
        // fame and draw eligibility: charting this week does not pull a track
        // out of the shuffle it was already part of.
        await tx.poolTrack.upsert({
          where: { id: member.trackId },
          create: {
            id: member.trackId,
            isrc: track.isrc,
            year: track.year,
            fame: track.fame,
            groupOnly: true,
          },
          update: {},
        });
      }

      await tx.trackGroupTrack.deleteMany({
        where: { trackGroupId: group.id },
      });
      await tx.trackGroupTrack.createMany({
        data: members.map((member) => ({
          trackId: member.trackId,
          trackGroupId: group.id,
        })),
        skipDuplicates: true,
      });

      return members.length;
    });
  }

  async countMembers(name: string): Promise<number> {
    return this.prisma.trackGroupTrack.count({
      where: { trackGroup: { type: TrackGroupType.CHART, name } },
    });
  }
}
