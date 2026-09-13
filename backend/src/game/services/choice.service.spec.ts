import { Test } from '@nestjs/testing';
import { GameMode, GameStatus } from '@prisma/client';
import { POOL_PLAYLIST_ID } from '../../consts';
import { PoolService } from '../../pool/services/pool.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackRepository } from '../../track/repositories/track.repository';
import { GameSessionEntity } from '../entities/game-session.entity';
import { GameSessionRepository } from '../repositories/game-session.repository';
import { ChoiceService } from './choice.service';

const track = (id: string, overrides: Partial<TrackEntity> = {}) =>
  new TrackEntity({
    id,
    name: `Song ${id}`,
    artistName: `Artist ${id}`,
    releaseYear: 1984,
    allArtists: [],
    lastScrapedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

const game = (
  overrides: Partial<GameSessionEntity> = {},
): GameSessionEntity => ({
  id: 'game-1',
  userId: 'user-1',
  playlistId: 'playlist-1',
  mode: GameMode.ALL,
  trackId: 'answer',
  currentRound: 4,
  guesses: [],
  status: GameStatus.PLAYING,
  createdAt: new Date(),
  choiceTrackIds: [],
  ...overrides,
});

describe('ChoiceService', () => {
  let service: ChoiceService;

  const answer = track('answer');
  const sessions = { findPlayedTracks: jest.fn() };
  const pool = { candidates: jest.fn() };
  const tracks = { findMany: jest.fn() };
  const library = new Map<string, TrackEntity>();

  beforeEach(async () => {
    jest.clearAllMocks();
    library.clear();
    sessions.findPlayedTracks.mockResolvedValue([]);
    pool.candidates.mockResolvedValue([]);
    tracks.findMany.mockImplementation((ids: string[]) =>
      Promise.resolve(ids.map((id) => library.get(id)).filter(Boolean)),
    );

    const module = await Test.createTestingModule({
      providers: [
        ChoiceService,
        { provide: GameSessionRepository, useValue: sessions },
        { provide: PoolService, useValue: pool },
        { provide: TrackRepository, useValue: tracks },
      ],
    }).compile();

    service = module.get(ChoiceService);
  });

  const own = (...items: TrackEntity[]) => {
    items.forEach((t) => library.set(t.id, t));
    sessions.findPlayedTracks.mockResolvedValue(items);
  };
  const inPool = (...items: TrackEntity[]) => {
    items.forEach((t) => library.set(t.id, t));
    pool.candidates.mockResolvedValue(
      items.map((t) => ({ id: t.id, fame: 1, year: t.releaseYear ?? 2000 })),
    );
  };

  it("offers the answer among the player's own earlier songs", async () => {
    own(track('a'), track('b'), track('c'));

    const ids = await service.pickChoiceIds(game(), answer);

    expect([...ids].sort()).toEqual(['a', 'answer', 'b', 'c']);
    expect(sessions.findPlayedTracks).toHaveBeenCalledWith(
      'user-1',
      'playlist-1',
      'answer',
    );
  });

  it('tops a new playlist up from the pool', async () => {
    own(track('a'));
    inPool(track('p1'), track('p2'));

    const ids = await service.pickChoiceIds(game(), answer);

    expect([...ids].sort()).toEqual(['a', 'answer', 'p1', 'p2']);
  });

  it("draws a group round's decoys from its own group", async () => {
    inPool(track('p1'), track('p2'), track('p3'));

    await service.pickChoiceIds(
      game({ playlistId: POOL_PLAYLIST_ID, trackGroupId: 'group-80s' }),
      answer,
    );

    expect(pool.candidates).toHaveBeenCalledWith('group-80s');
    expect(sessions.findPlayedTracks).not.toHaveBeenCalled();
  });

  // Otherwise two of the four buttons would both be right.
  it('skips a decoy that is the answer under another id', async () => {
    own(
      track('twin', { name: answer.name, artistName: answer.artistName }),
      track('a'),
      track('b'),
      track('c'),
    );

    const ids = await service.pickChoiceIds(game(), answer);

    expect(ids).not.toContain('twin');
    expect(ids).toHaveLength(4);
  });

  // Two wrong options would make the last round easier than intended.
  it('offers no choices when three decoys cannot be found', async () => {
    own(track('a'), track('b'));

    await expect(service.pickChoiceIds(game(), answer)).resolves.toEqual([]);
  });

  it('loads choices in stored order, without a cover to match against', async () => {
    own(track('a'), track('b'));
    library.set('answer', answer);

    const choices = await service.loadChoices(['b', 'answer', 'a']);

    expect(choices.map((c) => c.id)).toEqual(['b', 'answer', 'a']);
    expect(choices[0]).not.toHaveProperty('albumImageUrl');
  });
});
