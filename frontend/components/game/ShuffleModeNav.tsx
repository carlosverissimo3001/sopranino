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
import type { TrackGroupDto } from '@/sdk';

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
  onTrackGroupChange,
}: ShuffleModeNavProps) {
  const [setsOpen, setSetsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  // A sheet on a phone: the dropdown covered the round it belongs to.
  const isPhone = useIsBelowSm();
  // Green is what is playing; a pick made mid-round is named below the row.
  const playingName = useTrackGroupName(playingTrackGroupId);

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
          aria-pressed={!trackGroupId}
          onClick={() => pick(undefined)}
          className={`${PILL} ${playingTrackGroupId ? PILL_IDLE : PILL_ACTIVE}`}
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
          <Link key={href} href={href} className={`${PILL} ${PILL_IDLE}`}>
            <Icon className="hidden h-3.5 w-3.5 sm:block" />
            {label}
          </Link>
        ))}
      </div>

      {isPhone ? (
        <Drawer open={setsOpen} onOpenChange={setSetsOpen}>
          <DrawerContent className="max-h-[70dvh] border-fg/10 bg-[rgb(var(--surface))]">
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle className="text-sm">Pick a set</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">
              <SetChips
                selectedId={trackGroupId}
                onPick={(set) =>
                  pick(trackGroupId === set.id ? undefined : set)
                }
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
            className="absolute inset-x-0 top-full z-40 mx-auto mt-2 w-full max-w-[22rem] rounded-2xl border border-fg/10 bg-[rgb(var(--surface))] p-3 text-left shadow-2xl shadow-black/50"
          >
            <SetChips
              selectedId={trackGroupId}
              onPick={(set) => pick(trackGroupId === set.id ? undefined : set)}
            />
          </div>
        )
      )}
    </nav>
  );
}
