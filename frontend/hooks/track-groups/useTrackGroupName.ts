'use client';

import { TrackGroupDtoTypeEnum } from '@/sdk';
import { useTrackGroups } from './useTrackGroups';

/** A set's name as a player reads it ("UK chart"), from the lists already cached. */
export function useTrackGroupName(trackGroupId: string | undefined) {
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);

  const set = [...decades, ...genres, ...charts].find(
    (group) => group.id === trackGroupId,
  );
  if (!set) return undefined;
  return set.type === TrackGroupDtoTypeEnum.Chart
    ? `${set.name} chart`
    : set.name;
}
