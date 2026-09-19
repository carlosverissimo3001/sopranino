'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { VolumeSlider } from './VolumeSlider';
import { ArrowLeft, History } from 'lucide-react';
import { StreakBadge } from '@/components/daily/StreakBadge';
import type { GameStatsDto } from '@/sdk';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

interface GameHeaderProps {
  mode: GameMode;
  stats?: GameStatsDto | null;
  volume: number;
  onVolumeChange: (v: number) => void;
  /** Mode-specific controls after the volume, such as shuffle's sign-in. */
  trailing?: ReactNode;
  /** In place of the Back link, for a page that is itself the way in. */
  leading?: ReactNode;
  /**
   * Centred over the row rather than in it, so the controls on either side
   * never move it and it never moves them. From sm up only: a phone has no
   * room between the logo and sign-in.
   */
  center?: ReactNode;
}

export function GameHeader({
  mode,
  stats,
  volume,
  onVolumeChange,
  trailing,
  leading,
  center,
}: GameHeaderProps) {
  const isDaily = mode === GameMode.Daily;

  return (
    <div className="relative flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
      {center && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden max-w-[45%] -translate-x-1/2 items-center sm:flex">
          <div className="truncate">{center}</div>
        </div>
      )}
      {leading ?? (
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      )}
      {/* Chrome, not part of the round: pinned to the right with the other
          controls rather than sitting under the play button. */}
      <div className="ml-auto flex items-center gap-4">
        <VolumeSlider volume={volume} onVolumeChange={onVolumeChange} />
      </div>
      {isDaily && (
        <div className="flex items-center gap-4">
          {stats && (
            <StreakBadge
              currentStreak={stats.current}
              bestStreak={stats.best}
            />
          )}
          <Link
            href="/history?filter=daily"
            className="flex items-center gap-2 text-fg/60 hover:text-fg text-sm"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Link>
        </div>
      )}
      {trailing}
    </div>
  );
}
