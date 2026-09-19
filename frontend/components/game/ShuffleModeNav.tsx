'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronDown,
  Disc3,
  Shuffle,
  Timer,
  Users,
} from 'lucide-react';
import { SetChips } from '@/components/features/track-group/SetChips';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsBelowSm } from '@/hooks/useIsBelowSm';
import { useTrackGroupName } from '@/hooks/track-groups/useTrackGroupName';
import { groupHasFameTiers } from '@/lib/fame-tier';
import type { PlaylistItemDto, TrackGroupDto } from '@/sdk';

const PILL =
  'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors';
const PILL_IDLE = 'border-fg/10 text-fg/60 hover:border-fg/25 hover:text-fg';
const PILL_ACTIVE =
  'border-spotify-green/30 bg-spotify-green/15 text-spotify-green';

const LINKED_MODES = [
  { href: '/daily', icon: Calendar, label: 'Daily song' },
  { href: '/speed-run', icon: Timer, label: 'Speed run' },
  { href: '/multiplayer/join', icon: Users, label: 'With friends' },
];

interface ShuffleModeNavProps {
  /** The set picked; none for the whole pool. */
  trackGroupId?: string;
  /** The set the song on screen came from, until a pick made mid-round applies. */
  playingTrackGroupId?: string;
  /** What is playing when it is not a set, e.g. a Spotify playlist's name. */
  playingLabel?: string;
  /** Absent on pages where only a set can be played. */
  onPlaylistChange?: (playlist: PlaylistItemDto) => void;
  /** The playlist picked, so its chip reads as chosen like a set's does. */
  selectedPlaylistId?: string;
  /**
   * A mode with its own page, shown as the one being played. The daily plays
   * on the same screen but is not drawn from the pool, so neither of the pool's
   * pills is lit there.
   */
  current?: '/daily';
  /** `hasTiers` is false for a set whose songs are all one fame, such as a chart. */
  onTrackGroupChange: (
    groupId: string | undefined,
    hasTiers: boolean,
    slug?: string,
  ) => void;
}

/**
 * Where the shuffle draws from, picked without leaving the round, and the
 * other modes one tap away.
 */
export function ShuffleModeNav({
  trackGroupId,
  playingTrackGroupId,
  playingLabel,
  onTrackGroupChange,
  onPlaylistChange,
  selectedPlaylistId,
  current,
}: ShuffleModeNavProps) {
  const [setsOpen, setSetsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  // A sheet on a phone: the dropdown covered the round it belongs to.
  const isPhone = useIsBelowSm();
  // Green is what is playing; a pick made mid-round is named below the row.
  const playingName = useTrackGroupName(playingTrackGroupId) ?? playingLabel;

  // An overlay, so it closes the way one does: outside it, or with Escape. The
  // sheet brings its own.
  useEffect(() => {
    if (!setsOpen || isPhone) return;
    const onPointer = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setSetsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSetsOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [setsOpen, isPhone]);

  const pickPlaylist = (playlist: PlaylistItemDto) => {
    onPlaylistChange?.(playlist);
    setSetsOpen(false);
  };

  const pick = (set: TrackGroupDto | undefined) => {
    onTrackGroupChange(
      set?.id,
      set ? groupHasFameTiers(set.type) : true,
      set?.slug,
    );
    setSetsOpen(false);
  };

  return (
    <nav ref={panelRef} aria-label="Game modes" className="relative">
      {/* One row that scrolls on a phone: two rows of pills cost the cover
          its height. The panel stays outside, or the scroll would clip it. */}
      <div className="mx-auto flex w-fit max-w-full gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible">
        <button
          type="button"
          aria-pressed={!current && !trackGroupId}
          onClick={() => pick(undefined)}
          className={`${PILL} ${current || playingTrackGroupId || playingLabel ? PILL_IDLE : PILL_ACTIVE}`}
        >
          <Shuffle className="hidden h-3.5 w-3.5 sm:block" />
          All songs
        </button>

        <button
          type="button"
          aria-expanded={setsOpen}
          aria-haspopup="dialog"
          onClick={() => setSetsOpen((open) => !open)}
          className={`${PILL} ${playingName ? PILL_ACTIVE : PILL_IDLE}`}
        >
          <Disc3 className="hidden h-3.5 w-3.5 sm:block" />
          {playingName ?? 'Artists, decades & more'}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${setsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {LINKED_MODES.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={current === href ? 'page' : undefined}
            className={`${PILL} ${current === href ? PILL_ACTIVE : PILL_IDLE}`}
          >
            <Icon className="hidden h-3.5 w-3.5 sm:block" />
            {label}
          </Link>
        ))}
      </div>

      {isPhone ? (
        <Drawer open={setsOpen} onOpenChange={setSetsOpen}>
          {/* Lighter than the page and a ring above it, so the sheet reads as
              sitting on top rather than being part of the round. */}
          {/* One height for every tab: the sheet resizing as tabs were
              switched moved the tabs themselves. Long lists scroll, short ones
              leave a little room under them. */}
          <DrawerContent className="h-[56svh] border-fg/15 bg-surface shadow-[0_-12px_40px_rgba(0,0,0,0.55)]">
            <DrawerHeader className="pb-3 pt-3 text-left">
              <DrawerTitle className="text-xs font-bold uppercase tracking-wider text-fg/40">
                Pick a set
              </DrawerTitle>
            </DrawerHeader>
            {/* Chrome on iOS keeps its toolbar over the page and reports no
                safe-area inset, so the room has to be asked for. */}
            <div className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+3.5rem)]">
              <SetChips
                selectedId={trackGroupId ?? selectedPlaylistId}
                onPick={(set) =>
                  pick(trackGroupId === set.id ? undefined : set)
                }
                onPickPlaylist={onPlaylistChange ? pickPlaylist : undefined}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Hangs from the whole row: centred on a pill left of centre, it ran
           off the edge. */
        setsOpen && (
          <div
            role="dialog"
            aria-label="Pick a set"
            className="absolute inset-x-0 top-full z-40 mx-auto mt-2 w-full max-w-[27rem] rounded-2xl border border-fg/10 bg-[rgb(var(--surface))] p-3 text-left shadow-2xl shadow-black/50"
          >
            <SetChips
              selectedId={trackGroupId ?? selectedPlaylistId}
              onPick={(set) => pick(trackGroupId === set.id ? undefined : set)}
              onPickPlaylist={onPlaylistChange ? pickPlaylist : undefined}
            />
          </div>
        )
      )}
    </nav>
  );
}
