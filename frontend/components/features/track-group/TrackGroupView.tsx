'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrackGroupCard } from '@/components/track-group/TrackGroupCard';
import { PlaylistSkeleton } from '@/components/playlist/PlaylistSkeleton';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { TrackGroupDtoTypeEnum } from '@/sdk';

interface TrackGroupViewProps {
  defaultOpen: boolean;
  type?: TrackGroupDtoTypeEnum;
  title?: string;
}

/**
 * Everyone sees the ordinary groups, library or not. A linked player gets them
 * under their own playlists; an unlinked one gets them instead of an empty
 * page.
 *
 * Which groups a type returns is the server's call — a special one comes back
 * empty for anyone it is not for, and an empty list renders nothing, so the
 * rule does not have to be repeated here.
 */
function TrackGroupViewComponent({
  defaultOpen,
  type = TrackGroupDtoTypeEnum.Decade,
  title = 'Curated playlists',
}: TrackGroupViewProps) {
  const { data: groups, isPending, isError } = useTrackGroups(type);

  // Nothing is rendered from a guess while this loads: a grid that fills with
  // defaults and then rearranges is worse than one that arrives late.
  if (isPending) {
    return (
      <CollapsibleSection
        title={title}
        titleLabel={title}
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaylistSkeleton key={`group-skeleton-${i}`} />
          ))}
        </div>
      </CollapsibleSection>
    );
  }

  // Empty groups are filtered out server side, so nothing at all means the
  // pool is unseeded rather than that this player has none.
  if (isError || !groups || groups.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title={title}
      titleLabel={title}
      defaultOpen={defaultOpen}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6 justify-center"
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        {groups.map((group) => (
          <TrackGroupCard key={group.id} group={group} />
        ))}
      </motion.div>
    </CollapsibleSection>
  );
}

export const TrackGroupView = memo(TrackGroupViewComponent);
