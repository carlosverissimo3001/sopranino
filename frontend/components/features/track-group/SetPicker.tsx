'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { AskForASet } from './AskForASet';
import { SetTile } from './SetTile';
import { Rail } from '@/components/ui/Rail';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import {
  isPlayable,
  useMyPlaylistLibrary,
} from '@/hooks/playlists/useMyPlaylistLibrary';
import { PlaylistItemKind, TrackGroupDtoTypeEnum } from '@/sdk';
import type { PlaylistItemDto, TrackGroupDto } from '@/sdk';
import type { PlaylistSource } from '@/lib/playlist-links';

interface SetPickerProps {
  selectedId: string | undefined;
  onPick: (set: TrackGroupDto) => void;
  /** Absent where only a set can be played, e.g. a multiplayer room's source. */
  onPickPlaylist?: (playlist: PlaylistItemDto) => void;
  /** Special sets too, for the few who can see them. Empty for everyone else. */
  includeSpecial?: boolean;
  disabled?: boolean;
}

type Pickable = TrackGroupDto | PlaylistItemDto;

const bySize = (a: { trackCount: number }, b: { trackCount: number }) =>
  b.trackCount - a.trackCount;

/**
 * Every set a player can pick, mid-round: a search across all of them, then a
 * row per kind. The wall of chips it replaced grew with the catalogue.
 */
export function SetPicker({
  selectedId,
  onPick,
  onPickPlaylist,
  includeSpecial = false,
  disabled = false,
}: SetPickerProps) {
  const { data: artists = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Artist);
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);
  const { data: special = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Special);
  const { data: library } = useMyPlaylistLibrary();
  const [query, setQuery] = useState('');

  // Spotify playlists only where one can be played; elsewhere, imports alone.
  const playlists = (library?.items ?? []).filter(
    (item) =>
      isPlayable(item) &&
      (onPickPlaylist || item.kind === PlaylistItemKind.Imported),
  );

  // An import is a track group with a playlist's clothes on; only a Spotify
  // playlist takes the other path.
  const pick = (set: Pickable) => {
    if ('kind' in set && set.kind === PlaylistItemKind.Spotify) {
      onPickPlaylist?.(set);
      return;
    }
    onPick(
      'kind' in set
        ? ({
            id: set.id,
            name: set.name,
            slug: set.slug ?? '',
            type: TrackGroupDtoTypeEnum.Imported,
            trackCount: set.trackCount,
            imageUrl: set.imageUrl,
          } satisfies TrackGroupDto)
        : set,
    );
  };

  const kinds = useMemo(
    () =>
      [
        { label: onPickPlaylist ? 'Playlists' : 'Imported', sets: playlists },
        { label: 'Specials', sets: includeSpecial ? special : [] },
        { label: 'Artists', sets: [...artists].sort(bySize) },
        { label: 'Decades', sets: [...decades].sort(bySize) },
        { label: 'Genres', sets: [...genres].sort(bySize) },
        // The server leads with the player's own country.
        { label: 'Charts', sets: charts },
      ].filter((kind) => kind.sets.length > 0),
    [
      playlists,
      special,
      includeSpecial,
      artists,
      decades,
      genres,
      charts,
      onPickPlaylist,
    ],
  );

  const searching = query.trim().length > 0;
  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return kinds.flatMap((kind) =>
      kind.sets.filter((set) => set.name.toLowerCase().includes(needle)),
    );
  }, [kinds, query]);

  if (kinds.length === 0) {
    return <AskForASet />;
  }

  const tile = (set: Pickable) => (
    <SetTile
      key={set.id}
      name={set.name}
      imageUrl={set.imageUrl ?? undefined}
      selected={selectedId === set.id}
      disabled={disabled}
      source={
        'source' in set
          ? ((set.origin ?? set.source) as PlaylistSource | undefined)
          : undefined
      }
      onPick={() => pick(set)}
    />
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg/30"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sets"
          aria-label="Search sets"
          className="w-full rounded-full border border-fg/10 bg-fg/[0.04] py-2 pl-9 pr-9 !text-xs text-fg placeholder:text-fg/35 focus:border-spotify-green/40 focus:outline-none"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-fg/40 transition-colors hover:bg-fg/10 hover:text-fg"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {searching ? (
        hits.length === 0 ? (
          <p className="py-8 text-center text-xs text-fg/45">
            No set by that name.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {hits.map(tile)}
          </div>
        )
      ) : (
        kinds.map((kind) => (
          <Rail
            key={kind.label}
            compact
            title={kind.label}
            titleLabel={kind.label}
          >
            {kind.sets.map(tile)}
            {/* It asks for a missing artist, so it belongs with the artists. */}
            {kind.label === 'Artists' && (
              <div
                key="ask"
                className="flex h-full items-center justify-center rounded-lg border border-dashed border-fg/15 p-2 text-center"
              >
                <AskForASet variant="card" />
              </div>
            )}
          </Rail>
        ))
      )}
    </div>
  );
}
