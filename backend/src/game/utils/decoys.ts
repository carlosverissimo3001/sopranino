import { PoolCandidate } from '../../pool/repositories/pool-track.repository';
import { TrackEntity } from '../../track/entities/track.entity';
import { normalizeText } from '../../utils/text';
import { shuffleInPlace } from './utils';

export const DECOY_COUNT = 3;

const decadeOf = (year?: number | null) =>
  year ? Math.floor(year / 10) * 10 : null;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  shuffleInPlace(copy);
  return copy;
}

/**
 * Every candidate decoy id, best first: the player's own songs before the
 * pool's, and within each the answer's decade before any other. Random within
 * a tier, so a replay of the same song is not offered the same wrong answers.
 */
export function rankDecoyIds({
  answer,
  own,
  pool,
}: {
  answer: TrackEntity;
  own: TrackEntity[];
  pool: PoolCandidate[];
}): string[] {
  const decade = decadeOf(answer.releaseYear);
  const sameDecade = (year?: number | null) =>
    decade !== null && decadeOf(year) === decade;

  const tiers = [
    own.filter((t) => sameDecade(t.releaseYear)).map((t) => t.id),
    own.filter((t) => !sameDecade(t.releaseYear)).map((t) => t.id),
    pool.filter((c) => sameDecade(c.year)).map((c) => c.id),
    pool.filter((c) => !sameDecade(c.year)).map((c) => c.id),
  ];

  const seen = new Set([answer.id]);
  const ranked: string[] = [];
  for (const tier of tiers) {
    for (const id of shuffled(tier)) {
      if (!seen.has(id)) {
        seen.add(id);
        ranked.push(id);
      }
    }
  }
  return ranked;
}

/**
 * The same song under another id - a pool upload of a playlist track - would
 * be a second right answer among the choices.
 */
export function isSameSong(a: TrackEntity, b: TrackEntity): boolean {
  if (a.isrc && b.isrc && a.isrc === b.isrc) {
    return true;
  }
  return (
    normalizeText(a.name).toLowerCase() ===
      normalizeText(b.name).toLowerCase() &&
    normalizeText(a.artistName).toLowerCase() ===
      normalizeText(b.artistName).toLowerCase()
  );
}
