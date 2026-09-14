'use client';

import { useState } from 'react';
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
import { TrackGroupDtoTypeEnum } from '@/sdk';

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
  /** The decade or genre the round draws from; none for the whole pool. */
  trackGroupId?: string;
  onTrackGroupChange: (groupId: string | undefined) => void;
}

/**
 * Where the shuffle draws from, picked without leaving the round, and the
 * other modes one tap away.
 */
export function ShuffleModeNav({
  trackGroupId,
  onTrackGroupChange,
}: ShuffleModeNavProps) {
  const [setsOpen, setSetsOpen] = useState(false);
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const sets = [...decades, ...genres];
  const chosen = sets.find((set) => set.id === trackGroupId);

  return (
    <>
      <nav
        aria-label="Game modes"
        className="flex flex-wrap justify-center gap-1.5"
      >
        <button
          type="button"
          aria-pressed={!trackGroupId}
          onClick={() => onTrackGroupChange(undefined)}
          className={`${PILL} ${trackGroupId ? PILL_IDLE : PILL_ACTIVE}`}
        >
          <Shuffle className="hidden h-3.5 w-3.5 sm:block" />
          All songs
        </button>
        <button
          type="button"
          aria-expanded={setsOpen}
          onClick={() => setSetsOpen((open) => !open)}
          className={`${PILL} ${chosen ? PILL_ACTIVE : PILL_IDLE}`}
        >
          <Disc3 className="hidden h-3.5 w-3.5 sm:block" />
          {chosen ? chosen.name : 'Decades & genres'}
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
      </nav>
      {setsOpen && (
        <div className="flex max-w-md flex-wrap justify-center gap-1.5">
          {sets.map((set) => (
            <button
              key={set.id}
              type="button"
              aria-pressed={trackGroupId === set.id}
              onClick={() => {
                onTrackGroupChange(
                  trackGroupId === set.id ? undefined : set.id,
                );
                setSetsOpen(false);
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                trackGroupId === set.id
                  ? 'bg-spotify-green/20 text-spotify-green'
                  : 'bg-fg/5 text-fg/70 hover:bg-fg/10 hover:text-fg'
              }`}
            >
              {set.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
