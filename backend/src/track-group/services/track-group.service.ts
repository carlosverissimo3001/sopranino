import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackGroup, TrackGroupType } from '@prisma/client';
import { TrackGroupRepository } from '../repositories/track-group.repository';
import { TrackGroupDto } from '../dto/track-group.dto';
import { UserEntity } from '@/auth/entities/user.entity';
import { CHART_BY_COUNTRY } from '@/chart/chart.constants';

@Injectable()
export class TrackGroupService {
  constructor(private readonly repository: TrackGroupRepository) {}

  /**
   * A special group is for the handful of people it was made for, so it is
   * absent rather than locked for everyone else — a tile that refuses to open
   * invites the question this is trying not to raise.
   */
  static isVisible(type: TrackGroupType, user: UserEntity | null): boolean {
    if (type !== TrackGroupType.SPECIAL) {
      return true;
    }
    return !!user?.spotifyUserId && user.isTrusted;
  }

  async list(
    type: TrackGroupType,
    country?: string,
  ): Promise<TrackGroupDto[]> {
    const groups = this.homeChartFirst(
      await this.repository.listWithCounts(type),
      type,
      country,
    );

    return groups.map(
      ({ id, type: groupType, name, slug, imageUrl, trackCount }) => ({
        id,
        type: groupType,
        name,
        slug,
        trackCount,
        imageUrl: imageUrl ?? undefined,
      }),
    );
  }

  /**
   * A player's own country's chart leads, since it is the one they can
   * actually place. Only an exact match moves: with six charts, guessing which
   * country is "nearest" would reorder more than it explains, and a player
   * whose country has no chart keeps the order everyone else sees.
   */
  private homeChartFirst<T extends { name: string }>(
    groups: T[],
    type: TrackGroupType,
    country?: string,
  ): T[] {
    if (type !== TrackGroupType.CHART || !country) {
      return groups;
    }

    const home = CHART_BY_COUNTRY[country.toUpperCase()];
    const index = groups.findIndex((group) => group.name === home);
    if (index <= 0) {
      return groups;
    }

    return [groups[index], ...groups.filter((_, i) => i !== index)];
  }

  /**
   * By the name in the URL, which is how a shared link arrives. Absent and
   * not-for-you are the same answer here, so a slug cannot be used to find out
   * that a group exists.
   */
  async bySlug(slug: string, user: UserEntity | null): Promise<TrackGroupDto> {
    const group = await this.repository.findBySlugWithCount(slug);

    if (!group || !TrackGroupService.isVisible(group.type, user)) {
      throw new NotFoundException(`No track group ${slug}`);
    }

    return {
      id: group.id,
      type: group.type,
      name: group.name,
      slug: group.slug,
      trackCount: group.trackCount,
      imageUrl: group.imageUrl ?? undefined,
    };
  }

  /** Throws rather than returning null: a round cannot start without one. */
  async requireById(id: string): Promise<TrackGroup> {
    const group = await this.repository.findById(id);
    if (!group) {
      throw new NotFoundException(`No track group ${id}`);
    }
    return group;
  }
}
