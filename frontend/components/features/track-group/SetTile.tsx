'use client';

import Image from 'next/image';
import { Check, ListMusic } from 'lucide-react';
import { SourceMark } from '@/components/features/imports/SourceMark';
import type { PlaylistSource } from '@/lib/playlist-links';

interface SetTileProps {
  name: string;
  imageUrl?: string;
  selected: boolean;
  disabled?: boolean;
  /** Spotify or an import, marked beside the name as the chips did. */
  source?: PlaylistSource;
  onPick: () => void;
}

/**
 * A set at picker size: the browse card is 220px wide and the picker is a
 * drawer or a 27rem popover, so the cover carries it and the count goes.
 */
export function SetTile({
  name,
  imageUrl,
  selected,
  disabled = false,
  source,
  onPick,
}: SetTileProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={selected}
      className="group/tile w-full text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        className={`relative mb-1.5 aspect-square w-full overflow-hidden rounded-lg transition-[box-shadow,outline-color] ${
          selected
            ? 'outline outline-2 outline-offset-2 outline-spotify-green'
            : 'outline outline-2 outline-offset-2 outline-transparent'
        }`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-fg/[0.06]">
            <ListMusic className="h-5 w-5 text-fg/20" aria-hidden />
          </div>
        )}

        {selected && (
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-spotify-green text-spotify-black">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
          </span>
        )}
      </div>

      <p
        className={`flex items-center gap-1 truncate text-[11px] font-bold leading-tight transition-colors ${
          selected
            ? 'text-spotify-green'
            : 'text-fg/70 group-hover/tile:text-fg'
        }`}
      >
        {source && <SourceMark source={source} className="shrink-0" />}
        <span className="truncate">{name}</span>
      </p>
    </button>
  );
}
