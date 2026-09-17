'use client';

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

/** Every set a player can pick, one row of chips per kind. */
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
  const sections = [
    { label: 'Imported', sets: imported },
    { label: 'Artists', sets: artists },
    { label: 'Decades', sets: decades },
    { label: 'Genres', sets: genres },
    { label: 'Charts', sets: charts },
    { label: 'Special', sets: includeSpecial ? special : [] },
  ].filter((section) => section.sets.length > 0);

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-fg/35">
            {section.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {section.sets.map((set) => (
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
        </div>
      ))}
      <AskForASet />
    </div>
  );
}
