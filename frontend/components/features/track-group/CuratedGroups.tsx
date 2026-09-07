'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrackGroupCard } from '@/components/track-group/TrackGroupCard';
import { PlaylistSkeleton } from '@/components/playlist/PlaylistSkeleton';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { TrackGroupDtoTypeEnum } from '@/sdk';

interface CuratedGroupsProps {
  defaultOpen: boolean;
}

const GRID =
  'grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6 justify-center';

/**
 * One section for everything curated, with a tab per kind. Kinds are asked for
 * separately because that is what the endpoint takes; one that comes back empty
 * drops out, so a kind costs nothing until the pool has any of it.
 */
function CuratedGroupsComponent({ defaultOpen }: CuratedGroupsProps) {
  const decades = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const genres = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const charts = useTrackGroups(TrackGroupDtoTypeEnum.Chart);

  const kinds = [
    { label: 'Decade', query: decades },
    { label: 'Genre', query: genres },
    { label: 'Chart', query: charts },
  ].filter((kind) => kind.query.data?.length);

  const [selected, setSelected] = useState<string | null>(null);
  const kind = kinds.find((k) => k.label === selected) ?? kinds[0];

  // Nothing is rendered from a guess while this loads: a grid that fills with
  // defaults and then rearranges is worse than one that arrives late.
  if (decades.isPending || genres.isPending || charts.isPending) {
    return (
      <CollapsibleSection
        title="Curated"
        titleLabel="Curated"
        defaultOpen={defaultOpen}
      >
        <div className={GRID}>
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaylistSkeleton key={`group-skeleton-${i}`} />
          ))}
        </div>
      </CollapsibleSection>
    );
  }

  // Empty groups are filtered out server side, so nothing at all means the pool
  // is unseeded rather than that this player has none.
  if (!kind) {
    return null;
  }

  // On the title's row, where this app already puts a section's controls.
  const tabs = kinds.length > 1 && (
    <div className="flex items-center gap-1">
      {kinds.map((k) => (
        <button
          key={k.label}
          type="button"
          onClick={() => setSelected(k.label)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
            kind.label === k.label
              ? 'bg-fg/10 text-fg'
              : 'text-fg/40 hover:text-fg/70'
          }`}
        >
          {k.label}
        </button>
      ))}
    </div>
  );

  return (
    <CollapsibleSection
      title="Curated"
      titleLabel="Curated"
      actions={tabs || undefined}
      defaultOpen={defaultOpen}
    >
      <motion.div
        key={kind.label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={GRID}
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        {kind.query.data?.map((group) => (
          <TrackGroupCard key={group.id} group={group} />
        ))}
      </motion.div>
    </CollapsibleSection>
  );
}

export const CuratedGroups = memo(CuratedGroupsComponent);
