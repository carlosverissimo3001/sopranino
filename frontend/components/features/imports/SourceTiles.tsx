'use client';

import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
              // The route shown rather than spelled out three times over. The
              // panel says it in words once the pill is picked.
              <>
                <span className="sr-only">
                  via {PLAYLIST_SOURCES[info.via].name}
                </span>
                <span aria-hidden className="opacity-50">
                  ›
                </span>
                <SourceLogo
                  source={info.via}
                  aria-hidden
                  className={`h-3 w-3 shrink-0 ${PLAYLIST_SOURCES[info.via].tone.mark}`}
                />
              </>
            ) : (
              !info.supported && (
                <span className="font-semibold opacity-70">soon</span>
              )
            )}
          </button>
        );
      })}

      {/* The pills are shortcuts; the mechanism is a Deezer link, so services
          without one still work. Quiet, because it is a footnote. */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Playlists from another service"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg/30 transition-colors hover:bg-fg/5 hover:text-fg/60"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-56 space-y-1 border-fg/10 bg-surface p-3 text-xs leading-snug text-fg/60"
        >
          <p className="font-bold text-fg">Any service works</p>
          <p>Copy the playlist to Deezer, paste that link.</p>
          <p className="text-fg/40">The card then shows Deezer.</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
