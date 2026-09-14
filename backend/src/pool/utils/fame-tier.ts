import { FameTier } from '@prisma/client';

/** Most famous first. */
export const FAME_TIERS: FameTier[] = [
  FameTier.EASY,
  FameTier.MEDIUM,
  FameTier.HARD,
  FameTier.EXPERT,
  FameTier.IMPOSSIBLE,
];

/**
 * The four fame values that split the whole pool into five equal tiers, lowest
 * first. One scale for every set, so an Easy song is as famous in the 1970s as
 * in pop, and an old set simply has fewer of them.
 */
export function tierCuts(fames: number[]): number[] {
  if (fames.length === 0) return [];
  const sorted = [...fames].sort((a, b) => a - b);
  return [0.2, 0.4, 0.6, 0.8].map(
    (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))],
  );
}

export function tierOf(fame: number, cuts: number[]): FameTier {
  const cleared = cuts.filter((cut) => fame >= cut).length;
  return FAME_TIERS[FAME_TIERS.length - 1 - cleared];
}

/**
 * The tier asked for, then the rest by distance, the easier one first on a
 * tie: a player who has run out of Hard songs is better served by Medium than
 * by Expert.
 */
export function tierFallback(tier: FameTier): FameTier[] {
  const at = FAME_TIERS.indexOf(tier);
  return [...FAME_TIERS].sort(
    (a, b) =>
      Math.abs(FAME_TIERS.indexOf(a) - at) -
        Math.abs(FAME_TIERS.indexOf(b) - at) ||
      FAME_TIERS.indexOf(a) - FAME_TIERS.indexOf(b),
  );
}
