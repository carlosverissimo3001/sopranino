import { mostFamous } from './most-famous';

const candidate = (id: string, fame: number) => ({ id, fame, year: 2010 });

describe('mostFamous', () => {
  const pool = [
    candidate('a', 10),
    candidate('b', 900),
    candidate('c', 50),
    candidate('d', 400),
    candidate('e', 5),
    candidate('f', 700),
    candidate('g', 1),
    candidate('h', 300),
  ];

  it('keeps the top share by fame', () => {
    expect(mostFamous(pool, 0.25).map((c) => c.id)).toEqual(['b', 'f']);
  });

  it('rounds up, so a small group still offers something', () => {
    expect(mostFamous(pool.slice(0, 3), 0.25).map((c) => c.id)).toEqual(['b']);
  });

  it('leaves the list it was given alone', () => {
    const copy = [...pool];
    mostFamous(pool, 0.25);
    expect(pool).toEqual(copy);
  });
});
