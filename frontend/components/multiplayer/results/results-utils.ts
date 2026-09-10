import type { ScoreboardPlayerTotalDto } from '@/sdk';

export type GameOutcome = 'won' | 'lost' | 'tied';

export function deriveOutcome(
  sortedStandings: ScoreboardPlayerTotalDto[],
  myUserId: string | undefined,
): { outcome: GameOutcome; tiedPlayerNames: string[] } {
  if (!myUserId || sortedStandings.length === 0) {
    return { outcome: 'lost', tiedPlayerNames: [] };
  }

  const topScore = sortedStandings[0].totalScore;
  const tiedPlayers = sortedStandings.filter(
    (player) => player.totalScore === topScore,
  );
  const isTie = tiedPlayers.length > 1;
  const myStanding = sortedStandings.find(
    (player) => player.userId === myUserId,
  );
  const isAmongWinners = myStanding?.totalScore === topScore;

  if (isTie && isAmongWinners) {
    return {
      outcome: 'tied',
      tiedPlayerNames: tiedPlayers.map((player) => player.displayName),
    };
  }

  if (isAmongWinners) {
    return { outcome: 'won', tiedPlayerNames: [] };
  }

  return {
    outcome: 'lost',
    tiedPlayerNames: isTie
      ? tiedPlayers.map((player) => player.displayName)
      : [],
  };
}

export function assignRanks(standings: ScoreboardPlayerTotalDto[]): number[] {
  const ranks: number[] = [];
  let currentRank = 1;

  for (let index = 0; index < standings.length; index++) {
    if (
      index > 0 &&
      standings[index].totalScore < standings[index - 1].totalScore
    ) {
      currentRank = index + 1;
    }
    ranks.push(currentRank);
  }

  return ranks;
}

/** One ground per outcome. It used to hold pulse keyframes; nothing pulses now. */
export const BG_GRADIENTS: Record<GameOutcome, string> = {
  won: `radial-gradient(ellipse 130% 95% at 50% 0%, rgba(250, 204, 21, 0.22) 0%, transparent 52%),
     radial-gradient(ellipse 90% 130% at 80% 100%, rgba(34, 197, 94, 0.16) 0%, transparent 52%)`,
  tied: `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(250, 204, 21, 0.15) 0%, transparent 50%),
     radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.14) 0%, transparent 50%)`,
  lost: `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
     radial-gradient(ellipse 90% 130% at 80% 100%, rgba(113, 113, 122, 0.14) 0%, transparent 50%)`,
};
