'use client';

import { useParams } from 'next/navigation';
import { GamePage } from '@/components/game/GamePage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTrackGroupBySlug } from '@/hooks/track-groups/useTrackGroups';
import { GameStatsDtoModeEnum as GameMode } from '@/sdk';

/**
 * The slug is what is shareable; the id is what starts a round. Resolving one
 * to the other here keeps the id out of the URL, so a link survives the pool
 * being reseeded.
 */
export function GroupGameClient({ heading }: { heading?: string }) {
  const slug = useParams().slug as string;
  // By slug rather than by searching a list: the list is one kind of group at
  // a time, so a special one was never in the one this page happened to ask
  // for.
  const { data: group, isPending } = useTrackGroupBySlug(slug);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-black tracking-tight text-fg">
          No such collection
        </h1>
        <p className="max-w-sm text-sm text-fg/50">
          It may have been renamed since this link was made.
        </p>
      </main>
    );
  }

  return (
    <GamePage mode={GameMode.All} trackGroupId={group.id} heading={heading} />
  );
}
