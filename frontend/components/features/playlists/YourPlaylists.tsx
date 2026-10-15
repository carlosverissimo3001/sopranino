'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { Rail } from '@/components/ui/Rail';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { PlaylistFilters } from '@/components/features/playlist/PlaylistFilters';
import { ImportPanel } from '@/components/features/imports/ImportPanel';
import { ImportedPlaylistCard } from '@/components/features/imports/ImportedPlaylistCard';
import { SignUpForPlaylists } from './SignUpForPlaylists';
import { useMe } from '@/hooks/auth/useMe';
import { canImport } from '@/lib/can-import';
import { usePlaylistFilters } from '@/hooks/playlists/usePlaylistFilters';
import { useMyPlaylistLibrary } from '@/hooks/playlists/useMyPlaylistLibrary';
import { PlaylistSource } from '@/lib/playlist-links';
import { PlaylistItemKind } from '@/sdk';

const KINDS = [
  // Neutral: colour names a kind, and "all" is not one.
  {
    value: 'ALL' as const,
    label: 'All',
    accent: { bg: 'bg-fg', text: 'text-bg' },
  },
  { value: PlaylistItemKind.Spotify, label: 'Spotify' },
  // The purple imported cards are edged in, so the filter names them by it.
  {
    value: PlaylistItemKind.Imported,
    label: 'Imported',
    accent: { bg: 'bg-[#A238FF]', text: 'text-white' },
  },
];

export function YourPlaylists() {
  const { data: user } = useMe();
  const allowed = canImport(user);
  const filters = usePlaylistFilters();
  const { data, isLoading } = useMyPlaylistLibrary(
    filters.sortBy,
    filters.order,
  );
  const router = useRouter();
  // The palette's "Import a playlist" lands here with the panel open.
  const askedToImport = useSearchParams().has('import');
  const [isAdding, setIsAdding] = useState(askedToImport);
  // Scrolled to and focused once it mounts, which waits on the library.
  const scrollToAdder = useRef(askedToImport);

  useEffect(() => {
    if (!askedToImport) return;
    setIsAdding(true);
    router.replace('/', { scroll: false });
  }, [askedToImport, router]);

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

  const title = 'Your playlists';

  const actions = hasItems && (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
      <button
        type="button"
        onClick={() => setIsAdding(!isAdding)}
        aria-expanded={isAdding}
        className="inline-flex h-9 items-center gap-1.5 px-1 text-xs font-bold text-fg/60 transition-colors hover:text-fg"
      >
        {isAdding ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {isAdding ? 'Close' : 'Import'}
      </button>
      {/* Sorting belongs to /browse, where the whole library is listed. */}
      <PlaylistFilters
        kinds={hasBoth ? KINDS : undefined}
        kind={filters.kind}
        onKindChange={filters.setKind}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      {!hasItems && !isLoading && (
        <p className="-mt-2 mb-4 text-sm text-fg/60 sm:-mt-3 sm:mb-5 sm:text-base">
          Play songs from your own playlists. Only you see what you import.
        </p>
      )}

      {data?.spotifyUnavailable && (
        <p role="status" className="mb-4 text-xs text-fg/50">
          Spotify isn&apos;t answering right now, so only your imported
          playlists are listed.
        </p>
      )}

      {isLoading ? (
        <Rail title={title} titleLabel="Your playlists">
          {/* Enough to run past the edge, so the row does not grow as it fills. */}
          {Array.from({ length: 10 }).map((_, i) => (
            <CardSkeleton key={`playlist-skeleton-${i}`} />
          ))}
        </Rail>
      ) : (
        hasItems && (
          <Rail
            title={title}
            titleLabel="Your playlists"
            actions={actions || undefined}
            seeAll={{
              href: `/browse?kind=YOURS${filters.kind === 'ALL' ? '' : `&source=${filters.kind}`}`,
              count: shown.length,
            }}
          >
            {shown.map((item, index) =>
              item.kind === PlaylistItemKind.Imported ? (
                <ImportedPlaylistCard key={item.id} set={item} />
              ) : (
                <PlaylistCard
                  key={item.id}
                  index={index}
                  playlist={{
                    id: item.id,
                    name: item.name,
                    imageUrl: item.imageUrl ?? '',
                    totalTracks: item.trackCount,
                  }}
                  source={PlaylistSource.Spotify}
                />
              ),
            )}
          </Rail>
        )
      )}

      {showAdder && !isLoading && (
        <div
          ref={(node) => {
            if (node && scrollToAdder.current) {
              scrollToAdder.current = false;
              // A frame late, or the page is still settling underneath it.
              requestAnimationFrame(() => {
                node.scrollIntoView({ block: 'center' });
                node.querySelector('input')?.focus({ preventScroll: true });
              });
            }
          }}
          className={`space-y-3 sm:space-y-4 ${hasItems ? 'mt-4' : ''}`}
        >
          <ImportPanel
            onImported={() => setIsAdding(false)}
            disabled={!allowed}
          />
        </div>
      )}
    </div>
  );
}
