'use client';

import { useState } from 'react';
import { AskForASet } from './AskForASet';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import {
  isPlayable,
  useMyPlaylistLibrary,
} from '@/hooks/playlists/useMyPlaylistLibrary';
import { PlaylistItemKind, TrackGroupDtoTypeEnum } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';

interface SetChipsProps {
  selectedId: string | undefined;
  onPick: (set: TrackGroupDto) => void;
  /** Special sets too, for the few who can see them. Empty for everyone else. */
  includeSpecial?: boolean;
  disabled?: boolean;
}

/**
 * Every set a player can pick, one kind at a time. All of them at once filled a
 * phone screen and hid the round, and the list only grows.
 */
export function SetChips({
  selectedId,
  onPick,
  includeSpecial = false,
  disabled = false,
}: SetChipsProps) {
  const { data: artists = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Artist);
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);
  const { data: special = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Special);
  const { data: library } = useMyPlaylistLibrary();
  const imported = (library?.items ?? []).filter(
    (item) => item.kind === PlaylistItemKind.Imported && isPlayable(item),
  );
  const kinds = [
    { label: 'Imported', sets: imported },
    { label: 'Artists', sets: artists },
    { label: 'Decades', sets: decades },
    { label: 'Genres', sets: genres },
    { label: 'Charts', sets: charts },
    { label: 'Special', sets: includeSpecial ? special : [] },
  ].filter((kind) => kind.sets.length > 0);

  // The kind holding the current set opens first, so a change starts where the
  // player already is.
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const holdingSelected = kinds.find((kind) =>
    kind.sets.some((set) => set.id === selectedId),
  );
  const shown =
    kinds.find((kind) => kind.label === openLabel) ??
    holdingSelected ??
    kinds[0];

  if (!kinds.length) {
    return <AskForASet />;
  }

  return (
    <div className="space-y-3">
      {kinds.length > 1 && (
        <div
          role="tablist"
          aria-label="Kinds of set"
          className="-mx-1 flex gap-1 overflow-x-auto px-1"
        >
          {kinds.map((kind) => (
            <button
              key={kind.label}
              type="button"
              role="tab"
              aria-selected={kind.label === shown.label}
              onClick={() => setOpenLabel(kind.label)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                kind.label === shown.label
                  ? 'bg-fg/10 text-fg'
                  : 'text-fg/35 hover:text-fg/70'
              }`}
            >
              {kind.label}
            </button>
          ))}
        </div>
      )}

      <div
        role="tabpanel"
        aria-label={shown.label}
        className="flex flex-wrap gap-1.5"
      >
        {shown.sets.map((set) => (
          <button
            key={set.id}
            type="button"
            aria-pressed={selectedId === set.id}
            disabled={disabled}
            onClick={() => onPick(set)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 sm:px-2.5 sm:py-1 sm:text-[11px] ${
              selectedId === set.id
                ? 'bg-spotify-green/20 text-spotify-green'
                : 'bg-fg/5 text-fg/70 hover:bg-fg/10 hover:text-fg'
            }`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {/* It asks for a missing artist, so it belongs with the artists. */}
      {shown.label === 'Artists' && <AskForASet />}
    </div>
  );
}
