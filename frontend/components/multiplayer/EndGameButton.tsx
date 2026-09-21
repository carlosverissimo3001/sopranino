'use client';

import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { useEndRoom } from '@/hooks/multiplayer/useEndRoom';

interface EndGameButtonProps {
  roomId: string;
  /** Everyone but the host who has rounds left, said before it ends for them. */
  stillPlaying: number;
}

/** The host, done and waiting, stopping the wait. Asks once, inline. */
export function EndGameButton({ roomId, stillPlaying }: EndGameButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const endRoom = useEndRoom();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-8 items-center gap-1.5 rounded-full border border-fg/10 px-3 text-xs font-semibold text-fg/60 transition-colors hover:border-red-400/40 hover:text-red-300"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        End game
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label="End the game for everyone"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs"
    >
      <span className="font-semibold text-red-200">
        {stillPlaying} {stillPlaying === 1 ? 'player is' : 'players are'} still
        playing
      </span>
      <span className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={endRoom.isPending}
          className="h-7 rounded-full px-3 font-semibold text-fg/60 hover:text-fg"
        >
          Keep playing
        </button>
        <button
          type="button"
          onClick={() => endRoom.mutate(roomId)}
          disabled={endRoom.isPending}
          className="flex h-7 items-center gap-1.5 rounded-full bg-red-500 px-3 font-bold text-white hover:bg-red-400 disabled:opacity-60"
        >
          {endRoom.isPending && (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          )}
          End now
        </button>
      </span>
      {endRoom.isError && (
        <p className="w-full text-red-300">{endRoom.error.message}</p>
      )}
    </div>
  );
}
