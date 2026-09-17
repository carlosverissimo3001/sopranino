'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { PlaylistSkeleton } from '@/components/playlist/PlaylistSkeleton';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { PlaylistFilters } from '@/components/features/playlist/PlaylistFilters';
import { ImportPanel } from '@/components/features/imports/ImportPanel';
import { ImportedPlaylistCard } from '@/components/features/imports/ImportedPlaylistCard';
import { SourceTiles } from '@/components/features/imports/SourceTiles';
import { SignUpForPlaylists } from './SignUpForPlaylists';
import { useMe } from '@/hooks/auth/useMe';
import { canImport, spotifyIsLinked } from '@/lib/can-import';
import { usePlaylistFilters } from '@/hooks/playlists/usePlaylistFilters';
import { useMyPlaylistLibrary } from '@/hooks/playlists/useMyPlaylistLibrary';
import { PlaylistSource } from '@/lib/playlist-links';
import { PlaylistItemKind } from '@/sdk';

const GRID =
  'grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6 justify-center';

const KINDS = [
  { value: 'ALL' as const, label: 'All' },
  { value: PlaylistItemKind.Spotify, label: 'Spotify' },
  { value: PlaylistItemKind.Imported, label: 'Imported' },
];

export function YourPlaylists({ defaultOpen }: { defaultOpen: boolean }) {
  const { data: user } = useMe();
  const allowed = canImport(user);
  const filters = usePlaylistFilters();
  const { data, isLoading } = useMyPlaylistLibrary(filters.sortBy);
  const [source, setSource] = useState<PlaylistSource>(PlaylistSource.Deezer);
  const [isAdding, setIsAdding] = useState(false);

  if (!user) {
    return null;
  }
  if (!user.hasAccount) {
    return <SignUpForPlaylists />;
  }

  const items = data?.items ?? [];
  const hasBoth =
    items.some((item) => item.kind === PlaylistItemKind.Spotify) &&
    items.some((item) => item.kind === PlaylistItemKind.Imported);
  const shown =
    hasBoth && filters.kind !== 'ALL'
      ? items.filter((item) => item.kind === filters.kind)
      : items;
  const hasItems = allowed && items.length > 0;
  const showAdder = !hasItems || isAdding;

  const actions = hasItems && (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
      <button
        type="button"
        onClick={() => setIsAdding(!isAdding)}
        aria-expanded={isAdding}
        className="inline-flex h-8 items-center gap-1.5 px-1 text-xs font-bold text-fg/60 transition-colors hover:text-fg sm:h-9"
      >
        {isAdding ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {isAdding ? 'Close' : 'Import'}
      </button>
      <PlaylistFilters
        kinds={hasBoth ? KINDS : undefined}
        kind={filters.kind}
        onKindChange={filters.setKind}
        sortBy={filters.sortBy}
        onSortByChange={filters.setSortBy}
      />
    </div>
  );

  return (
    <CollapsibleSection
      title="Your playlists"
      titleLabel="Your playlists"
      actions={actions || undefined}
      defaultOpen={defaultOpen}
    >
      {!hasItems && !isLoading && (
        <p className="-mt-2 mb-4 text-sm text-fg/60 sm:-mt-3 sm:mb-5 sm:text-base">
          Play songs from your own playlists. Only you see what you import.
        </p>
      )}

      {showAdder && !isLoading && (
        <div className={`space-y-3 sm:space-y-4 ${hasItems ? 'mb-6' : ''}`}>
          <SourceTiles
            selected={source}
            onSelect={setSource}
            without={spotifyIsLinked(user) ? [PlaylistSource.Spotify] : []}
          />
          <ImportPanel
            source={source}
            onSourceChange={setSource}
            onImported={() => setIsAdding(false)}
            disabled={!allowed}
          />
        </div>
      )}

      {data?.spotifyUnavailable && (
        <p role="status" className="mb-4 text-xs text-fg/50">
          Spotify isn&apos;t answering right now, so only your imported
          playlists are listed.
        </p>
      )}

      {isLoading ? (
        <div className={GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <PlaylistSkeleton key={`playlist-skeleton-${i}`} />
          ))}
        </div>
      ) : (
        hasItems && (
          <div className={GRID}>
            {shown.map((item, index) =>
              item.kind === PlaylistItemKind.Imported ? (
                <div key={item.id} className="group/card">
                  <ImportedPlaylistCard set={item} />
                </div>
              ) : (
                <div key={item.id} className="relative h-full">
                  <PlaylistCard
                    index={index}
                    playlist={{
                      id: item.id,
                      name: item.name,
                      imageUrl: item.imageUrl ?? '',
                      totalTracks: item.trackCount,
                    }}
                    source={PlaylistSource.Spotify}
                  />
                </div>
              ),
            )}
          </div>
        )
      )}
    </CollapsibleSection>
  );
}
