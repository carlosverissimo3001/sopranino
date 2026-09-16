import { Injectable } from '@nestjs/common';
import { TrackGroupType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { mapTrack } from '../../utils/mappers';

@Injectable()
export class ChartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertChart(chart: {
    slug: string;
    name: string;
    imageUrl?: string;
  }): Promise<string> {
    const group = await this.prisma.trackGroup.upsert({
      where: { slug: chart.slug },
      create: {
        type: TrackGroupType.CHART,
        name: chart.name,
        slug: chart.slug,
        imageUrl: chart.imageUrl,
      },
      update: {
        name: chart.name,
        ...(chart.imageUrl && { imageUrl: chart.imageUrl }),
      },
      select: { id: true },
    });
    return group.id;
  }

  /** A chart's tracks, in the order it listed them. */
  async members(name: string): Promise<TrackEntity[]> {
    const rows = await this.prisma.trackGroupTrack.findMany({
      where: { trackGroup: { type: TrackGroupType.CHART, name } },
      orderBy: { createdAt: 'asc' },
      include: { track: true },
    });
    return rows.map((row) => mapTrack(row.track));
  }

  /** Cover art per chart, keyed by the group's name. */
  async imageUrlsByName(): Promise<Map<string, string>> {
    const groups = await this.prisma.trackGroup.findMany({
      where: { type: TrackGroupType.CHART },
      select: { name: true, imageUrl: true },
    });
    return new Map(
      groups
        .filter((group) => group.imageUrl)
        .map((group) => [group.name, group.imageUrl as string]),
    );
  }

  async countMembers(name: string): Promise<number> {
    return this.prisma.trackGroupTrack.count({
      where: { trackGroup: { type: TrackGroupType.CHART, name } },
    });
  }
}
