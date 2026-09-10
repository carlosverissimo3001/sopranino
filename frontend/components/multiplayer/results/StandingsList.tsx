'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScoreboardPlayerTotalDto } from '@/sdk';
import { Podium } from './Podium';
import { StandingsItem } from './StandingsItem';

interface StandingsListProps {
  standings: ScoreboardPlayerTotalDto[];
  ranks: number[];
  currentUserId?: string;
}

/** Past this, a leaderboard is a phone book. */
const VISIBLE_RANKS = 10;

export function StandingsList({
  standings,
  ranks,
  currentUserId,
}: StandingsListProps) {
  const [showAll, setShowAll] = useState(false);

  const podium = standings.slice(0, 3);
  const rest = standings.slice(3);
  const shown = showAll ? rest : rest.slice(0, VISIBLE_RANKS - 3);

  // Finishing 14th is exactly when you most want to see your own line, so it
  // is pinned rather than cut with everyone else.
  const selfIndex = standings.findIndex((p) => p.userId === currentUserId);
  const selfIsHidden =
    selfIndex >= 0 && selfIndex >= podium.length + shown.length;
  const isTruncatable = rest.length > VISIBLE_RANKS - 3;

  return (
    <div className="mx-auto mb-8 w-full max-w-lg">
      <Podium
        players={podium}
        ranks={ranks.slice(0, 3)}
        currentUserId={currentUserId}
      />

      {rest.length > 0 && (
        <div role="list" className="space-y-1.5">
          {shown.map((player, index) => (
            <StandingsItem
              key={player.userId}
              player={player}
              rank={ranks[index + 3]}
              isCurrentUser={player.userId === currentUserId}
            />
          ))}

          {selfIsHidden && (
            <div className="pt-1.5">
              <div
                aria-hidden="true"
                className="mb-1.5 border-t border-dashed border-fg/10"
              />
              <StandingsItem
                player={standings[selfIndex]}
                rank={ranks[selfIndex]}
                isCurrentUser
              />
            </div>
          )}

          {isTruncatable && (
            <button
              type="button"
              onClick={() => setShowAll((open) => !open)}
              aria-expanded={showAll}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-fg/[0.08] py-2 text-xs font-bold text-fg/45 hover:bg-fg/[0.04] hover:text-fg/70 transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${standings.length}`}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
