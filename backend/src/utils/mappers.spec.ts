import { GameMode, GameStatus } from '@prisma/client';
import { mapGameSession } from './mappers';

describe('mapGameSession', () => {
  const session = (guesses: unknown[]) =>
    ({
      id: 'session-1',
      userId: 'user-1',
      playlistId: 'pool',
      mode: GameMode.ALL,
      trackId: 'track-1',
      currentRound: guesses.length,
      status: GameStatus.PLAYING,
      guesses,
      createdAt: new Date(),
      completedAt: null,
    }) as unknown as Parameters<typeof mapGameSession>[0];

  // The history is read, appended to and written back on every guess, so
  // anything the mapper drops is lost from all earlier rounds.
  it("keeps each guess's audio report", () => {
    const audio = { played: true, contextState: 'running', sessionHeld: true };

    const { guesses } = mapGameSession(
      session([
        { result: 'SKIP', audio },
        { result: 'SKIP', trackName: 'Song', artistName: 'Artist' },
      ]),
    );

    expect(guesses[0].audio).toEqual(audio);
    expect(guesses[1]).not.toHaveProperty('audio');
  });
});
