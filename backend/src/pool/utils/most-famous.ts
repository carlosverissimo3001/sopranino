import { PoolCandidate } from '../repositories/pool-track.repository';

/** The top `share` of candidates by fame, never fewer than one. */
export function mostFamous(
  candidates: PoolCandidate[],
  share: number,
): PoolCandidate[] {
  const keep = Math.max(1, Math.ceil(candidates.length * share));
  return [...candidates].sort((a, b) => b.fame - a.fame).slice(0, keep);
}
