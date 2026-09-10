'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMe } from '@/hooks/auth/useMe';
import { useMultiplayerScoreboard } from '@/hooks/multiplayer/useMultiplayerScoreboard';
import { useMultiplayerSocket } from '@/hooks/multiplayer/useMultiplayerSocket';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { RoundBreakdown } from './RoundBreakdown';
import { ResultsHeader } from './ResultsHeader';
import { StandingsList } from './StandingsList';
import { WaitingForPlayers } from './WaitingForPlayers';
import { assignRanks, BG_GRADIENTS, deriveOutcome } from './results-utils';

interface ResultsContainerProps {
  roomId: string;
}

export function ResultsContainer({ roomId }: ResultsContainerProps) {
  const [socketPlayerProgress, setSocketPlayerProgress] = useState<
    Map<string, number>
  >(() => new Map());

  const onPlayerRoundComplete = useCallback(
    (data: { userId: string; roundIndex: number }) => {
      setSocketPlayerProgress((prev) => {
        const current = prev.get(data.userId) ?? -1;
        if (data.roundIndex <= current) return prev;
        const next = new Map(prev);
        next.set(data.userId, data.roundIndex);
        return next;
      });
    },
    [],
  );

  const { connected, hostDisconnected } = useMultiplayerSocket(roomId, {
    onPlayerRoundComplete,
  });
  const {
    data: scoreboard,
    isLoading,
    error,
  } = useMultiplayerScoreboard(roomId, connected);
  const { data: me } = useMe();
  const { data: room } = useRoom(roomId, connected);

  const scoreboardPlayerProgress = useMemo(() => {
    const progress = new Map<string, number>();
    if (!scoreboard) {
      return progress;
    }

    for (const round of scoreboard.rounds) {
      for (const player of round.players) {
        const current = progress.get(player.userId) ?? -1;
        if (round.roundIndex > current) {
          progress.set(player.userId, round.roundIndex);
        }
      }
    }

    return progress;
  }, [scoreboard]);

  const playerProgress = useMemo(() => {
    if (socketPlayerProgress.size === 0) {
      return scoreboardPlayerProgress;
    }

    const merged = new Map(scoreboardPlayerProgress);
    for (const [userId, roundIndex] of socketPlayerProgress) {
      const current = merged.get(userId) ?? -1;
      if (roundIndex > current) {
        merged.set(userId, roundIndex);
      }
    }
    return merged;
  }, [scoreboardPlayerProgress, socketPlayerProgress]);

  const isComplete = scoreboard?.isComplete ?? false;

  const currentUserId = useMemo(() => {
    if (!me || !room) {
      return undefined;
    }

    return room.players.find((player) => player.userId === me.userId)?.userId;
  }, [me, room]);

  const sortedStandings = useMemo(
    () =>
      [...(scoreboard?.standings ?? [])].sort(
        (left, right) => right.totalScore - left.totalScore,
      ),
    [scoreboard?.standings],
  );

  const ranks = useMemo(() => assignRanks(sortedStandings), [sortedStandings]);

  const { outcome, tiedPlayerNames } = useMemo(
    () => deriveOutcome(sortedStandings, currentUserId),
    [sortedStandings, currentUserId],
  );

  const winner = sortedStandings[0];
  const personalScore = useMemo(
    () =>
      sortedStandings.find((player) => player.userId === currentUserId)
        ?.totalScore,
    [sortedStandings, currentUserId],
  );

  if (isLoading) {
    return (
      <div
        className="flex h-screen h-[100dvh] items-center justify-center"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !scoreboard) {
    return (
      <div
        className="flex h-screen h-[100dvh] items-center justify-center p-4"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-400">Failed to load results</p>
          <Link href="/" className="text-sm text-[#1DB954] hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return (
      <WaitingForPlayers
        players={room?.players ?? []}
        totalRounds={room?.roundCount ?? 0}
        playerProgress={playerProgress}
        hostDisconnected={hostDisconnected}
      />
    );
  }

  if (!winner) {
    return null;
  }

  const hasBreakdown = scoreboard.rounds.length > 0;

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-y-auto"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: BG_GRADIENTS[outcome] }}
      />

      <div className="sticky top-0 z-20 border-b border-fg/5 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center px-3 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="Back to Home"
            className="group flex items-center gap-2 text-sm font-bold text-fg/60 hover:text-fg transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex flex-col p-3 sm:p-6 md:p-8 lg:p-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto w-full max-w-xl">
            <ResultsHeader
              outcome={outcome}
              winner={winner}
              tiedPlayerNames={tiedPlayerNames}
              personalScore={personalScore}
            />
          </div>

          {/* Two columns only when there is a second thing to put in one.
              A breakdown-less room would otherwise leave half the width empty. */}
          <div
            className={
              hasBreakdown
                ? 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-8'
                : 'mx-auto w-full max-w-xl'
            }
          >
            <StandingsList
              standings={sortedStandings}
              ranks={ranks}
              currentUserId={currentUserId}
            />

            <RoundBreakdown rounds={scoreboard.rounds} />
          </div>
        </div>
      </div>
    </div>
  );
}
