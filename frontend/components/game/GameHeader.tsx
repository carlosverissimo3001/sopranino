'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VolumeSlider } from './VolumeSlider';
import { ArrowLeft, Play, BarChart3, History } from 'lucide-react';
import { StreakBadge } from '@/components/daily/StreakBadge';
import type { PlaylistDto, GameStatsDto } from '@/sdk';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

interface GameHeaderProps {
  mode: GameMode;
  playlist?: PlaylistDto | null;
  stats?: GameStatsDto | null;
  volume: number;
  onVolumeChange: (v: number) => void;
  /** Mode-specific controls after the volume, such as shuffle's sign-in. */
  trailing?: ReactNode;
  /** In place of the Back link, for a page that is itself the way in. */
  leading?: ReactNode;
}

export function GameHeader({
  mode,
  playlist,
  stats,
  volume,
  onVolumeChange,
  trailing,
  leading,
}: GameHeaderProps) {
  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
      {leading ?? (
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      )}
      {isPlaylist && playlist && (
        <div className="flex items-center gap-2.5 ml-2 min-w-0">
          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-fg/10 flex-shrink-0">
            {playlist.imageUrl ? (
              <Image
                src={playlist.imageUrl}
                alt={playlist.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-4 h-4 text-fg/40" />
              </div>
            )}
          </div>
          <span className="text-sm text-fg/40 truncate max-w-[180px]">
            {playlist.name}
          </span>
        </div>
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
            <BarChart3 className="w-4 h-4" />
            Stats
          </Link>
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
