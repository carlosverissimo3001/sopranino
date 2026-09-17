'use client';

import {
  PLAYLIST_SOURCES,
  SOURCE_ORDER,
  type PlaylistSource,
} from '@/lib/playlist-links';
import { SourceLogo } from './SourceLogo';

interface SourceTilesProps {
  selected: PlaylistSource;
  onSelect: (source: PlaylistSource) => void;
  /** Shown but not pickable, with a reason: their Spotify is already linked. */
  unavailable?: Partial<Record<PlaylistSource, string>>;
}

export function SourceTiles({
  selected,
  onSelect,
  unavailable = {},
}: SourceTilesProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Where the playlist is"
      className="flex flex-wrap gap-2"
    >
      {SOURCE_ORDER.map((source) => {
        const info = PLAYLIST_SOURCES[source];
        const isSelected = source === selected;
        const reason = unavailable[source];
        const pickable = info.supported && !reason;
        return (
          <button
            key={source}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!pickable}
            onClick={() => onSelect(source)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
              isSelected ? info.tone.chipOn : info.tone.chipOff
            } ${pickable ? '' : 'opacity-60'}`}
          >
            <SourceLogo source={source} className="h-3.5 w-3.5 shrink-0" />
            {info.name}
            {reason ? (
              <span className="font-semibold opacity-70">{reason}</span>
            ) : info.via ? (
              <span className="font-semibold opacity-70">
                via {PLAYLIST_SOURCES[info.via].name}
              </span>
            ) : (
              !info.supported && (
                <span className="font-semibold opacity-70">soon</span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
