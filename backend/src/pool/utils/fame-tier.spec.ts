import { FameTier } from '@prisma/client';
import { tierCuts, tierFallback, tierOf } from './fame-tier';

describe('fame tiers', () => {
  const fames = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);

  it('splits the pool into five equal tiers', () => {
    const cuts = tierCuts(fames);
    const counts = new Map<FameTier, number>();
    for (const fame of fames) {
      const tier = tierOf(fame, cuts);
      counts.set(tier, (counts.get(tier) ?? 0) + 1);
    }

    expect([...counts.values()]).toEqual([20, 20, 20, 20, 20]);
  });

  it('calls the most famous songs Easy and the least famous Impossible', () => {
    const cuts = tierCuts(fames);

    expect(tierOf(1000, cuts)).toBe(FameTier.EASY);
    expect(tierOf(10, cuts)).toBe(FameTier.IMPOSSIBLE);
  });

  it('has no cuts for an empty pool', () => {
    expect(tierCuts([])).toEqual([]);
  });

  it('falls back to the nearest tier, the easier one first', () => {
    expect(tierFallback(FameTier.HARD)).toEqual([
      FameTier.HARD,
      FameTier.MEDIUM,
      FameTier.EXPERT,
      FameTier.EASY,
      FameTier.IMPOSSIBLE,
    ]);
    expect(tierFallback(FameTier.IMPOSSIBLE)[1]).toBe(FameTier.EXPERT);
  });
});
