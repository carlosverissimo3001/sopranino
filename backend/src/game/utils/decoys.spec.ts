import { TrackEntity } from '../../track/entities/track.entity';
import { isSameSong, rankDecoyIds } from './decoys';

const track = (
  id: string,
  releaseYear?: number,
  overrides: Partial<TrackEntity> = {},
) =>
  new TrackEntity({
    id,
    name: `Song ${id}`,
    artistName: `Artist ${id}`,
    releaseYear,
    allArtists: [],
    lastScrapedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

const candidate = (id: string, year: number) => ({ id, fame: 1, year });

describe('rankDecoyIds', () => {
  const answer = track('answer', 1984);

  it("puts the player's own songs first, the answer's decade first within each", () => {
    const ranked = rankDecoyIds({
      answer,
      own: [track('own-90s', 1995), track('own-80s', 1981)],
      pool: [candidate('pool-00s', 2003), candidate('pool-80s', 1988)],
    });

    expect(ranked).toEqual(['own-80s', 'own-90s', 'pool-80s', 'pool-00s']);
  });

  it('never offers the answer, and offers each id once', () => {
    const ranked = rankDecoyIds({
      answer,
      own: [track('answer', 1984), track('shared', 1984)],
      pool: [candidate('answer', 1984), candidate('shared', 1984)],
    });

    expect(ranked).toEqual(['shared']);
  });

  it('treats every candidate alike when the answer has no year', () => {
    const ranked = rankDecoyIds({
      answer: track('answer'),
      own: [track('own', 1984)],
      pool: [candidate('pool', 1984)],
    });

    expect(ranked).toEqual(['own', 'pool']);
  });
});

describe('isSameSong', () => {
  it('matches the same recording under another id', () => {
    expect(
      isSameSong(
        track('spotify', 1984, { isrc: 'GB123' }),
        track('deezer', 1984, { isrc: 'GB123' }),
      ),
    ).toBe(true);
  });

  it('matches a title and artist that differ only in case', () => {
    expect(
      isSameSong(
        track('a', 1984, { name: 'Beso', artistName: 'ROSALÍA' }),
        track('b', 1984, { name: 'BESO', artistName: 'ROSALÍA' }),
      ),
    ).toBe(true);
  });

  it('does not match two songs by the same artist', () => {
    expect(
      isSameSong(
        track('a', 1984, { name: 'Beso', artistName: 'Rosalía' }),
        track('b', 1984, { name: 'Despechá', artistName: 'Rosalía' }),
      ),
    ).toBe(false);
  });
});
