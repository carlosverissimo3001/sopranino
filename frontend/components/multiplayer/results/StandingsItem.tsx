import Image from 'next/image';
import { memo } from 'react';
import { Crown } from 'lucide-react';
import type { ScoreboardPlayerTotalDto } from '@/sdk';

const RANK_STYLES: Record<
  number,
  { badge: string; ring: string; glow: string }
> = {
  1: {
    badge: 'bg-yellow-400 text-black',
    ring: 'ring-yellow-400 ring-[3px]',
    glow: 'shadow-lg shadow-yellow-400/20',
  },
  2: {
    badge: 'bg-gray-300 text-black',
    ring: 'ring-gray-300 ring-2',
    glow: '',
  },
  3: {
    badge: 'bg-amber-700 text-fg',
    ring: 'ring-amber-700 ring-2',
    glow: '',
  },
};

interface StandingsItemProps {
  player: ScoreboardPlayerTotalDto;
  rank: number;
  isCurrentUser: boolean;
}

function StandingsItemBase({
  player,
  rank,
  isCurrentUser,
}: StandingsItemProps) {
  const style = RANK_STYLES[rank];
  const isTopRank = rank === 1;

  return (
    <div
      role="listitem"
      className={`relative overflow-hidden rounded-xl border border-fg/10 bg-[#101010] ${
        isTopRank ? 'px-4 py-3.5' : 'px-4 py-2.5'
      }`}
      style={{
        background: isTopRank
          ? 'linear-gradient(135deg, rgba(250,204,21,0.14) 0%, rgba(18,18,18,0.62) 62%)'
          : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            style?.badge ?? 'bg-fg/10 text-fg/40'
          }`}
        >
          {rank}
        </div>

        <div
          className={`h-10 w-10 shrink-0 overflow-hidden rounded-full ${style?.ring ?? 'ring-1 ring-fg/10'} ${
            style?.glow ?? ''
          }`}
        >
          {player.avatarUrl ? (
            <Image
              src={player.avatarUrl}
              alt={player.displayName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-fg/10">
              <span className="text-sm font-bold text-fg/50">
                {player.displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p
            className={`truncate font-semibold ${isTopRank ? 'text-base text-fg' : 'text-sm text-fg/85'}`}
          >
            {player.displayName}
          </p>
          {isCurrentUser && (
            <span className="rounded-full border border-[#1DB954]/40 bg-[#1DB954]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1DB954]">
              YOU
            </span>
          )}
          {isTopRank && <Crown className="h-5 w-5 shrink-0 text-yellow-400" />}
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`tabular-nums font-black ${isTopRank ? 'text-2xl text-yellow-400' : 'text-xl text-[#1DB954]'}`}
          >
            {player.totalScore}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-fg/35">pts</p>
        </div>
      </div>
    </div>
  );
}

export const StandingsItem = memo(StandingsItemBase);
