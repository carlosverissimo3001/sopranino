'use client';

import { Timer } from 'lucide-react';
import { useFinishCountdown } from '@/hooks/multiplayer/useFinishCountdown';

/**
 * The host has played the room out, so everyone still in it is on the clock.
 * Shown whatever round they are on: the window belongs to the room, not to a
 * song, and a player mid-round has no other way of knowing it started.
 */
export function FinishCountdownBanner({ deadline }: { deadline?: Date }) {
  const secondsLeft = useFinishCountdown(deadline);

  if (secondsLeft === null) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200"
    >
      <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        The host has finished, you have{' '}
        <span className="tabular-nums">{secondsLeft}</span> seconds to finish
        the game
      </span>
    </div>
  );
}
