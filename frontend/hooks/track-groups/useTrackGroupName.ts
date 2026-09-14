'use client';

import { TrackGroupDtoTypeEnum } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';
import { setLabel } from '@/lib/track-group-labels';
import { useTrackGroups } from './useTrackGroups';

/** A set by id, from the lists already cached for the picker. */
export function useTrackGroupById(
  trackGroupId: string | undefined,
): TrackGroupDto | undefined {
  const { data: artists = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Artist);
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);

  return [...artists, ...decades, ...genres, ...charts].find(
    (group) => group.id === trackGroupId,
  );
}

export function useTrackGroupName(trackGroupId: string | undefined) {
  const set = useTrackGroupById(trackGroupId);
  return set ? setLabel(set) : undefined;
}
