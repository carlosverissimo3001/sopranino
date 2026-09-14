'use client';

import { TrackGroupDtoTypeEnum } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';
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

/** A set's name as a player reads it ("UK chart"). */
export function setLabel(set: TrackGroupDto): string {
  return set.type === TrackGroupDtoTypeEnum.Chart
    ? `${set.name} chart`
    : set.name;
}

/** What the round is asking, in the set's own terms. */
export function guessLine(set: TrackGroupDto): string {
  switch (set.type) {
    case TrackGroupDtoTypeEnum.Artist:
      // "The Weeknd's", but "Harry Styles'".
      return `Guess ${set.name}${set.name.endsWith('s') ? '’' : '’s'} song`;
    case TrackGroupDtoTypeEnum.Chart:
      return `Guess a song from the ${set.name} chart`;
    default:
      return `Guess a ${set.name} song`;
  }
}

export function useTrackGroupName(trackGroupId: string | undefined) {
  const set = useTrackGroupById(trackGroupId);
  return set ? setLabel(set) : undefined;
}
