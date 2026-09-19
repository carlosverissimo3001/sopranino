import { ARTIST_SET_MIN_TRACKS } from '../../consts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackGroup, TrackGroupType } from '@prisma/client';
import { TrackGroupRepository } from '../repositories/track-group.repository';
import { TrackGroupDto } from '../dto/track-group.dto';
import { TrackGroupCatalogDto } from '../dto/track-group-catalog.dto';
import { SetMemberDto } from '../dto/set-member.dto';
import { UserEntity } from '@/auth/entities/user.entity';
import { CHART_BY_COUNTRY } from '@/chart/chart.constants';
import { TrackRepository } from '@tracks/repositories/track.repository';
import { PoolService } from '@/pool/services/pool.service';
import { Transactional } from '@transaction/transactional.decorator';

@Injectable()
export class TrackGroupService {
  constructor(
    private readonly repository: TrackGroupRepository,
    private readonly trackRepository: TrackRepository,
    private readonly poolService: PoolService,
  ) {}

  /**
   * A special group is for the handful of people it was made for, so it is
   * absent rather than locked for everyone else — a tile that refuses to open
   * invites the question this is trying not to raise. Imports are never listed.
   */
  static isListable(type: TrackGroupType, user: UserEntity | null): boolean {
    if (type === TrackGroupType.IMPORTED) {
      return false;
    }
    if (type !== TrackGroupType.SPECIAL) {
      return true;
    }
    return !!user?.spotifyUserId && user.isTrusted;
  }

  async canSee(
    group: Pick<TrackGroup, 'id' | 'type'>,
    user: UserEntity | null,
  ): Promise<boolean> {
    if (group.type === TrackGroupType.IMPORTED) {
      return !!user && this.repository.isMember(user.id, group.id);
    }
    return TrackGroupService.isListable(group.type, user);
  }

  /** Missing and not-yours are the same 404, so an id cannot probe for a set. */
  async requireVisible(
    id: string,
    user: UserEntity | null,
  ): Promise<TrackGroup> {
    const group = await this.repository.findById(id);
    if (!group || !(await this.canSee(group, user))) {
      throw new NotFoundException(`No track group ${id}`);
    }
    return group;
  }

  @Transactional({ timeout: 60_000 })
  async replaceMembers(
    trackGroupId: string,
    members: SetMemberDto[],
  ): Promise<void> {
    const created = members.flatMap((member) =>
      member.create ? [{ id: member.trackId, ...member.create }] : [],
    );

    await this.trackRepository.createMissing(
      created.map(
        ({
          id,
          isrc,
          name,
          artistName,
          albumName,
          albumUrl,
          albumImageUrl,
        }) => ({
          id,
          isrc,
          name,
          artistName,
          albumName,
          albumUrl,
          albumImageUrl,
        }),
      ),
    );
    await this.poolService.addGroupOnly(
      created.map(({ id, isrc, year, fame }) => ({ id, isrc, year, fame })),
    );
    await this.repository.replaceTracks(
      trackGroupId,
      members.map((member) => member.trackId),
    );
    this.poolService.forget(trackGroupId);
  }

  async catalog(user: UserEntity | null): Promise<TrackGroupCatalogDto> {
    const listFor = (type: TrackGroupType) =>
      TrackGroupService.isListable(type, user)
        ? this.list(type, user?.country)
        : Promise.resolve([]);

    const [artist, decade, genre, chart, special] = await Promise.all([
      listFor(TrackGroupType.ARTIST),
      listFor(TrackGroupType.DECADE),
      listFor(TrackGroupType.GENRE),
      listFor(TrackGroupType.CHART),
      listFor(TrackGroupType.SPECIAL),
    ]);
    return { artist, decade, genre, chart, special };
  }

  async list(type: TrackGroupType, country?: string): Promise<TrackGroupDto[]> {
    const listed = await this.repository.listWithCounts(type);
    const groups = this.homeChartFirst(
      type === TrackGroupType.ARTIST
        ? listed.filter((group) => group.trackCount >= ARTIST_SET_MIN_TRACKS)
        : listed,
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

    if (!group || !(await this.canSee(group, user))) {
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
