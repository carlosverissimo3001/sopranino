import { Trophy } from 'lucide-react';
import type { ScoreboardPlayerTotalDto } from '@/sdk';
import type { GameOutcome } from './results-utils';

interface ResultsHeaderProps {
  outcome: GameOutcome;
  winner: ScoreboardPlayerTotalDto;
  tiedPlayerNames: string[];
  personalScore?: number;
}

/**
 * A tie of twenty rendered every name in a four line paragraph. Even three
 * reads badly, so past two the rest are counted rather than listed.
 */
function formatTiedNames(names: string[]): string {
  if (names.length <= 2) {
    return names.join(' & ');
  }
  return `${names[0]}, ${names[1]} and ${names.length - 2} others`;
}

export function ResultsHeader({
  outcome,
  winner,
  tiedPlayerNames,
  personalScore,
}: ResultsHeaderProps) {
  if (outcome === 'won') {
    return (
      // The avatar, the crown and the score all appear again in the first
      // standing a few pixels below. One line here, not a podium.
      <header className="mb-6 text-center">
        <h1
          aria-live="polite"
          className="text-3xl font-black text-fg sm:text-4xl"
        >
          You Won!
        </h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-fg/50">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Final score{' '}
          <span className="font-black tabular-nums text-yellow-400">
            {winner.totalScore}
          </span>
        </p>
      </header>
    );
  }

  if (outcome === 'tied') {
    return (
      <header className="mb-6 text-center">
        <h1
          aria-live="polite"
          className="text-3xl font-black text-fg sm:text-4xl"
        >
          It&apos;s a Tie!
        </h1>
        <p className="mt-2 text-fg/60">
          <span className="font-semibold text-yellow-400">
            {formatTiedNames(tiedPlayerNames)}
          </span>{' '}
          finished with{' '}
          <span className="font-semibold text-yellow-400">
            {winner.totalScore}
          </span>{' '}
          points
        </p>
      </header>
    );
  }

  return (
    <header className="mb-6 text-center">
      <h1
        aria-live="polite"
        className="text-3xl font-black text-fg sm:text-4xl"
      >
        Good Game!
      </h1>
      <p className="mt-2 text-fg/60">
        <span className="font-semibold text-zinc-200">
          {winner.displayName}
        </span>{' '}
        wins with{' '}
        <span className="font-semibold text-zinc-100">{winner.totalScore}</span>{' '}
        points
      </p>
      {personalScore !== undefined && (
        <p className="mt-2 text-sm text-fg/40">
          Your score:{' '}
          <span className="font-semibold text-[#1DB954]">{personalScore}</span>
        </p>
      )}
    </header>
  );
}
