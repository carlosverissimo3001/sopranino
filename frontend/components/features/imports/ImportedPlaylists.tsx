'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { PlaylistSkeleton } from '@/components/playlist/PlaylistSkeleton';
import { useMe } from '@/hooks/auth/useMe';
import { canImport, useMyImports } from '@/hooks/imports/useMyImports';
import { PlaylistSource } from '@/lib/playlist-links';
import { ImportPanel } from './ImportPanel';
import { ImportedPlaylistCard } from './ImportedPlaylistCard';
import { SourceTiles } from './SourceTiles';

const GRID =
  'grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6 justify-center';

export function ImportedPlaylists({ defaultOpen }: { defaultOpen: boolean }) {
  const { data: user } = useMe();
  const { data: sets = [], isPending } = useMyImports();
  const allowed = canImport(user);
  const [source, setSource] = useState<PlaylistSource>(PlaylistSource.Deezer);
  const [isAdding, setIsAdding] = useState(false);

  // A guest is asked to sign up elsewhere on this page.
  if (!user?.hasAccount) {
    return null;
  }

  const hasSets = allowed && sets.length > 0;
  const showAdder = !hasSets || isAdding;

  const adder = (
    <div className="space-y-3 sm:space-y-4">
      <SourceTiles selected={source} onSelect={setSource} />
      <ImportPanel
        source={source}
        onSourceChange={setSource}
        onImported={() => setIsAdding(false)}
        disabled={!allowed}
      />
    </div>
  );

  const toggle = hasSets && (
    <button
      type="button"
      onClick={() => setIsAdding(!isAdding)}
      aria-expanded={isAdding}
      className="inline-flex items-center gap-1.5 rounded-full bg-fg/10 px-3 py-1.5 text-xs font-bold text-fg transition-colors hover:bg-fg/15"
    >
      {isAdding ? (
        <X className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      {isAdding ? 'Close' : 'Add playlist'}
    </button>
  );

  return (
    <CollapsibleSection
      title="Imported playlists"
      titleLabel="Imported playlists"
      actions={toggle || undefined}
      defaultOpen={defaultOpen}
    >
      {!hasSets && (
        <p className="-mt-2 mb-4 text-sm text-fg/60 sm:-mt-3 sm:mb-5 sm:text-base">
          Play songs from your own playlists. Only you see what you import.
        </p>
      )}

      {showAdder && <div className={hasSets ? 'mb-6' : ''}>{adder}</div>}

      {allowed && isPending ? (
        <div className={`${GRID} mt-6`}>
          {Array.from({ length: 2 }).map((_, i) => (
            <PlaylistSkeleton key={`import-skeleton-${i}`} />
          ))}
        </div>
      ) : (
        hasSets && (
          <div className={GRID}>
            {sets.map((set) => (
              <div key={set.id} className="group/card">
                <ImportedPlaylistCard set={set} />
              </div>
            ))}
          </div>
        )
      )}
    </CollapsibleSection>
  );
}
