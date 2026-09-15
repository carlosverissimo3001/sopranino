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
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { useTrackGroupName } from '@/hooks/track-groups/useTrackGroupName';
import { groupHasFameTiers } from '@/lib/fame-tier';
import { TrackGroupDtoTypeEnum } from '@/sdk';
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
  onTrackGroupChange: (groupId: string | undefined, hasTiers: boolean) => void;
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
  const { data: artists = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Artist);
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);
  const sections = [
    { label: 'Artists', sets: artists },
    { label: 'Decades', sets: decades },
    { label: 'Genres', sets: genres },
    { label: 'Charts', sets: charts },
  ].filter((section) => section.sets.length > 0);
  // Green is what is playing; a pick made mid-round is named below the row.
  const playingName = useTrackGroupName(playingTrackGroupId);

  // An overlay, so it closes the way one does: outside it, or with Escape.
  useEffect(() => {
    if (!setsOpen) return;
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
  }, [setsOpen]);

  const pick = (set: TrackGroupDto | undefined) => {
    onTrackGroupChange(set?.id, set ? groupHasFameTiers(set.type) : true);
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

      {/* Hangs from the whole row: centred on a pill left of centre, it ran off
          the edge of a phone. */}
      {setsOpen && (
        <div
          role="dialog"
          aria-label="Pick a set"
          className="absolute inset-x-0 top-full z-40 mx-auto mt-2 w-full max-w-[22rem] space-y-3 rounded-2xl border border-fg/10 bg-[rgb(var(--surface))] p-3 text-left shadow-2xl shadow-black/50"
        >
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
                    aria-pressed={trackGroupId === set.id}
                    onClick={() =>
                      pick(trackGroupId === set.id ? undefined : set)
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-2.5 sm:py-1 sm:text-[11px] ${
                      trackGroupId === set.id
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
        </div>
      )}
    </nav>
  );
}
