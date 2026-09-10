import type { ScoreboardPlayerTotalDto } from '@/sdk';
import { StandingsItem } from './StandingsItem';

interface StandingsListProps {
  standings: ScoreboardPlayerTotalDto[];
  ranks: number[];
  currentUserId?: string;
}

/**
 * No entrance animation. A per-child stagger is a fixed cost each, so what
 * read as polish at four players was nearly three seconds of withheld page at
 * twenty. Reduced motion does not save it either: framer drops the transform
 * and keeps the delay.
 */
export function StandingsList({
  standings,
  ranks,
  currentUserId,
}: StandingsListProps) {
  return (
    <div role="list" className="mb-8 space-y-2">
      {standings.map((player, index) => (
        <StandingsItem
          key={player.userId}
          player={player}
          rank={ranks[index]}
          isCurrentUser={player.userId === currentUserId}
        />
      ))}
    </div>
  );
}
