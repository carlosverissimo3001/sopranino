import { TrackGroupDtoTypeEnum } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';

/** A set's name as a player reads it ("UK chart"). */
export function setLabel(set: Pick<TrackGroupDto, 'name' | 'type'>): string {
  return set.type === TrackGroupDtoTypeEnum.Chart
    ? `${set.name} chart`
    : set.name;
}

/** What the round is asking, in the set's own terms. */
export function guessLine(set: Pick<TrackGroupDto, 'name' | 'type'>): string {
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
