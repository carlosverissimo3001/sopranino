import Image from 'next/image';
import { Crown } from 'lucide-react';
import type { ScoreboardPlayerTotalDto } from '@/sdk';

interface PodiumProps {
  /** Top three in finishing order, with the ranks that go with them. */
  players: ScoreboardPlayerTotalDto[];
  ranks: number[];
  currentUserId?: string;
}

/**
 * Placement is by CSS order, so the winner is centre on screen while the
 * markup still reads first, second, third.
 */
const PLACES = [
  {
    order: 'order-2',
    height: 'h-24 sm:h-28',
    block: 'bg-gradient-to-b from-yellow-400/25 to-yellow-400/5',
    accent: 'text-yellow-400',
    ring: 'ring-[3px] ring-yellow-400 shadow-lg shadow-yellow-400/25',
    avatar: 'h-14 w-14 sm:h-16 sm:w-16',
  },
  {
    order: 'order-1',
    height: 'h-16 sm:h-20',
    block: 'bg-gradient-to-b from-gray-300/20 to-gray-300/5',
    accent: 'text-gray-200',
    ring: 'ring-2 ring-gray-300',
    avatar: 'h-12 w-12 sm:h-14 sm:w-14',
  },
  {
    order: 'order-3',
    height: 'h-12 sm:h-14',
    block: 'bg-gradient-to-b from-amber-700/25 to-amber-700/5',
    accent: 'text-amber-500',
    ring: 'ring-2 ring-amber-700',
    avatar: 'h-12 w-12 sm:h-14 sm:w-14',
  },
];

export function Podium({ players, ranks, currentUserId }: PodiumProps) {
  return (
    <div className="mb-6 flex items-end justify-center gap-2 sm:gap-3">
      {players.map((player, index) => {
        const place = PLACES[index];
        const isFirst = index === 0;

        return (
          <div
            key={player.userId}
            className={`flex w-24 flex-col items-center sm:w-28 ${place.order}`}
          >
            <div className="flex min-h-[7.5rem] w-full flex-col items-center justify-end">
              <div className="relative mb-2">
                <div
                  className={`overflow-hidden rounded-full ${place.avatar} ${place.ring}`}
                >
                  {player.avatarUrl ? (
                    <Image
                      src={player.avatarUrl}
                      alt={player.displayName}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-fg/10 text-xl font-bold text-fg/60">
                      {player.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {isFirst && (
                  <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
                    <Crown className="h-3.5 w-3.5 text-yellow-900" />
                  </div>
                )}
              </div>

              <p className="w-full truncate px-1 text-center text-xs font-bold text-fg sm:text-sm">
                {player.displayName}
              </p>
              {player.userId === currentUserId && (
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1DB954]">
                  You
                </span>
              )}
            </div>

            <div
              className={`mt-2 flex w-full flex-col items-center justify-center rounded-t-xl border border-b-0 border-fg/[0.08] ${place.block} ${place.height}`}
            >
              <span className={`text-2xl font-black ${place.accent}`}>
                {ranks[index]}
              </span>
              <span
                className={`text-sm font-black tabular-nums ${place.accent}`}
              >
                {player.totalScore}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
