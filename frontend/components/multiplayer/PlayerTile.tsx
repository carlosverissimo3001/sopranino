import Image from 'next/image';
import { Crown, X } from 'lucide-react';
import type { RoomPlayerDto } from '@/sdk';

type PlayerTileProps = {
  player: RoomPlayerDto;
  isHost: boolean;
  isCurrentUser: boolean;
  isReady?: boolean;
  isOnline?: boolean;
  /** Present only when the viewer is the host and the room has not started. */
  onKick?: () => void;
};

/**
 * Readiness is the ring rather than a badge. Twenty badges is noise; a ring
 * reads across a whole grid without being read.
 */
function PlayerTile(props: PlayerTileProps) {
  const { player, isHost, isCurrentUser, isReady, isOnline, onKick } = props;

  const firstName = player.displayName.split(' ')[0];

  return (
    <div className="group relative flex w-[4.5rem] flex-col items-center gap-1 py-1.5">
      <div className="relative">
        <div
          className={`rounded-full p-0.5 ring-2 transition-colors ${
            isReady ? 'ring-green-500' : 'ring-fg/10'
          }`}
        >
          {player.avatarUrl ? (
            <Image
              src={player.avatarUrl}
              alt={player.displayName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fg/10 text-base font-bold text-fg/60">
              {player.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {isHost && (
          <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 shadow">
            <Crown className="h-3 w-3 text-yellow-900" />
          </div>
        )}

        {isOnline !== undefined && (
          <div
            className={`absolute -bottom-0.5 right-0 h-3 w-3 rounded-full border-2 border-bg ${
              isOnline ? 'bg-green-500' : 'bg-fg/30'
            }`}
          />
        )}

        {/* Shown on touch, where there is no hover to reveal it. */}
        {onKick && (
          <button
            type="button"
            onClick={onKick}
            aria-label={`Remove ${player.displayName} from the room`}
            className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-fg/10 bg-bg text-fg/40 transition-[opacity,color] hover:text-red-400 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <p
        className={`w-full truncate px-1 text-center text-xs ${
          isCurrentUser ? 'font-bold text-fg' : 'text-fg/60'
        }`}
        title={player.displayName}
      >
        {isCurrentUser ? 'You' : firstName}
      </p>
    </div>
  );
}

export default PlayerTile;
