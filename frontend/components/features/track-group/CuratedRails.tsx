'use client';

import { memo } from 'react';
import { TrackGroupCard } from '@/components/track-group/TrackGroupCard';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { Rail } from '@/components/ui/Rail';
import { AskForASetCard } from './AskForASetCard';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { TrackGroupControllerListTypeEnum as Kind } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';

/**
 * One row per kind. The server orders charts by the player's country and keeps
 * specials as they are; the rest lead with their fullest sets.
 */
const KINDS = [
  { type: Kind.Artist, title: 'Artists', keepServerOrder: false },
  { type: Kind.Decade, title: 'Decades', keepServerOrder: false },
  { type: Kind.Genre, title: 'Genres', keepServerOrder: false },
  { type: Kind.Chart, title: 'Charts', keepServerOrder: true },
  { type: Kind.Special, title: 'Specials', keepServerOrder: true },
] as const;

const bySize = (a: TrackGroupDto, b: TrackGroupDto) =>
  b.trackCount - a.trackCount;

function CuratedRailsComponent() {
  const artists = useTrackGroups(Kind.Artist);
  const decades = useTrackGroups(Kind.Decade);
  const genres = useTrackGroups(Kind.Genre);
  const charts = useTrackGroups(Kind.Chart);
  const specials = useTrackGroups(Kind.Special);

  const byType = {
    [Kind.Artist]: artists,
    [Kind.Decade]: decades,
    [Kind.Genre]: genres,
    [Kind.Chart]: charts,
    [Kind.Special]: specials,
  };

  if (artists.isPending) {
    return (
      <Rail title="Artists" titleLabel="Artists">
        {Array.from({ length: 10 }).map((_, index) => (
          <CardSkeleton key={`set-skeleton-${index}`} />
        ))}
      </Rail>
    );
  }

  return (
    <>
      {KINDS.map(({ type, title, keepServerOrder }) => {
        const groups = byType[type].data ?? [];
        if (groups.length === 0) return null;
        const ordered = keepServerOrder ? groups : [...groups].sort(bySize);

        return (
          <Rail
            key={type}
            title={title}
            titleLabel={title}
            seeAll={{ href: `/browse?kind=${type}`, count: groups.length }}
          >
            {ordered.map((group) => (
              <TrackGroupCard key={group.id} group={group} />
            ))}
            {/* Last in the row: whoever got here did not find theirs. */}
            {type === Kind.Artist && <AskForASetCard key="ask" />}
          </Rail>
        );
      })}
    </>
  );
}

export const CuratedRails = memo(CuratedRailsComponent);
