import Image from 'next/image';
import { memo } from 'react';
import type { ScoreboardPlayerTotalDto } from '@/sdk';

interface StandingsItemProps {
  player: ScoreboardPlayerTotalDto;
  rank: number;
  isCurrentUser: boolean;
}

/** Fourth place down. The medals live on the podium, so a row is just a row. */
function StandingsItemBase({
  player,
  rank,
  isCurrentUser,
}: StandingsItemProps) {
  return (
    <div
      role="listitem"
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
        isCurrentUser
          ? 'border-[#1DB954]/30 bg-[#1DB954]/[0.07]'
          : 'border-fg/[0.08] bg-[#101010]'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-fg/35">
        {rank}
      </span>

      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-fg/10">
        {player.avatarUrl ? (
          <Image
            src={player.avatarUrl}
            alt={player.displayName}
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-fg/10">
            <span className="text-xs font-bold text-fg/50">
              {player.displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <p className="min-w-0 flex-1 truncate text-sm text-fg/85">
        {player.displayName}
      </p>

      {isCurrentUser && (
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-[#1DB954]">
          You
        </span>
      )}

      <span
        className={`shrink-0 text-sm font-black tabular-nums ${
          isCurrentUser ? 'text-[#1DB954]' : 'text-fg/70'
        }`}
      >
        {player.totalScore}
      </span>
    </div>
  );
}

export const StandingsItem = memo(StandingsItemBase);
