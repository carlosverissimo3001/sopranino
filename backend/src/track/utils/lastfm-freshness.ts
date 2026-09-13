import { isAfter, subDays } from 'date-fns';
import { TrackMetadataVo } from '../vo/track-metadata.vo';

const LASTFM_REUSE_DAYS = 30;

export function hasFreshLastfm(meta: TrackMetadataVo): boolean {
  const fetchedAt = meta.lastfm?.fetchedAt;
  return (
    !!fetchedAt &&
    isAfter(new Date(fetchedAt), subDays(new Date(), LASTFM_REUSE_DAYS))
  );
}
