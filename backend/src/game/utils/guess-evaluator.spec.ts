import { GameStatus } from '@prisma/client';
import { TrackEntity } from '../../track/entities/track.entity';
import { GuessResult, ROUND_DURATIONS } from '../consts';
import { GuessDto } from '../dto/guess/guess.dto';
import {
  evaluateGuess,
  scoreGuess,
  normalizeIsrc,
  addGuessToHistory,
  calculateNextState,
  getSnippetDuration,
} from './guess-evaluator';

describe('guess-evaluator', () => {
  const makeTrack = (overrides?: Partial<TrackEntity>): TrackEntity =>
    ({
      id: 'track-actual',
      name: 'Shape of You',
      artistName: 'Ed Sheeran',
      albumName: '÷ (Divide)',
      albumImageUrl: undefined,
      albumUrl: undefined,
      releaseYear: 2017,
      previewUrl: 'https://example.com/preview.mp3',
      allArtists: ['Ed Sheeran'],
      lastScrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as TrackEntity;

  // The case that raised it: Creepin' is filed under Metro Boomin, and both
  // guesses share The Weeknd with it.
  describe('shared artists', () => {
    const creepin = makeTrack({
      id: 'dz:1',
      name: "Creepin'",
      artistName: 'Metro Boomin',
      albumName: 'HEROES & VILLAINS',
      allArtists: ['Metro Boomin'],
    });
    const blindingLights = {
      trackId: '2',
      trackName: 'Blinding Lights',
      artistName: 'The Weeknd',
      albumName: 'After Hours',
    };

    it('scores a shared artist as right when both lists are known', () => {
      expect(
        evaluateGuess(blindingLights, creepin, {
          guess: ['The Weeknd'],
          actual: ['Metro Boomin', 'The Weeknd', '21 Savage'],
        }),
      ).toBe(GuessResult.Artist);
    });

    it('compares names as the main-artist check does, ignoring case', () => {
      expect(
        evaluateGuess(blindingLights, creepin, {
          guess: ['the weeknd'],
          actual: ['THE WEEKND'],
        }),
      ).toBe(GuessResult.Artist);
    });

    it('stays wrong when nobody is shared', () => {
      expect(
        evaluateGuess(blindingLights, creepin, {
          guess: ['The Weeknd'],
          actual: ['Metro Boomin', '21 Savage'],
        }),
      ).toBe(GuessResult.Wrong);
    });

    it('turns a right album into right artist and album', () => {
      expect(
        evaluateGuess(
          { ...blindingLights, albumName: 'HEROES & VILLAINS' },
          creepin,
          { guess: ['The Weeknd'], actual: ['Metro Boomin', 'The Weeknd'] },
        ),
      ).toBe(GuessResult.ArtistAndAlbum);
    });

    describe('scoreGuess', () => {
      const credits: Record<string, string[]> = {
        '2': ['The Weeknd'],
        'dz:1': ['Metro Boomin', 'The Weeknd', '21 Savage'],
      };
      const artistsOf = jest.fn((track: { id?: string | null }) =>
        Promise.resolve(credits[track.id ?? ''] ?? []),
      );

      beforeEach(() => artistsOf.mockClear());

      it('looks the credits up when the plain check says wrong', async () => {
        await expect(
          scoreGuess(blindingLights, creepin, artistsOf),
        ).resolves.toBe(GuessResult.Artist);
        expect(artistsOf).toHaveBeenCalledTimes(2);
      });

      it('looks nothing up for a guess that is already right', async () => {
        await expect(
          scoreGuess(
            {
              trackId: 'dz:1',
              trackName: "Creepin'",
              artistName: 'Metro Boomin',
            },
            creepin,
            artistsOf,
          ),
        ).resolves.toBe(GuessResult.Correct);
        expect(artistsOf).not.toHaveBeenCalled();
      });

      it('looks nothing up when the main artists already match', async () => {
        await scoreGuess(
          { trackId: '9', trackName: 'Superhero', artistName: 'Metro Boomin' },
          creepin,
          artistsOf,
        );
        expect(artistsOf).not.toHaveBeenCalled();
      });

      it('uses the credits a track already carries instead of looking them up', async () => {
        const fromSpotify = makeTrack({
          ...creepin,
          allArtists: ['Metro Boomin', 'The Weeknd', '21 Savage'],
        });

        await expect(
          scoreGuess(blindingLights, fromSpotify, artistsOf),
        ).resolves.toBe(GuessResult.Artist);
        expect(artistsOf).toHaveBeenCalledTimes(1);
        expect(artistsOf).toHaveBeenCalledWith(
          expect.objectContaining({ id: '2' }),
        );
      });

      it('scores as it does today when the lookup only knows the main artist', async () => {
        const mainOnly = jest.fn((track: { artistName?: string | null }) =>
          Promise.resolve(track.artistName ? [track.artistName] : []),
        );

        await expect(
          scoreGuess(blindingLights, creepin, mainOnly),
        ).resolves.toBe(GuessResult.Wrong);
      });
    });
  });

  describe('normalizeIsrc', () => {
    it('strips separators and upcases', () => {
      expect(normalizeIsrc('gb-ahs-17-00028')).toBe('GBAHS1700028');
    });

    it('returns an empty string for nullish input', () => {
      expect(normalizeIsrc(undefined)).toBe('');
      expect(normalizeIsrc(null)).toBe('');
    });
  });

  describe('evaluateGuess', () => {
    const track = makeTrack();

    describe('ISRC matching', () => {
      const spotifySide = makeTrack({ isrc: 'GBAHS1700028' });

      it('matches a guess from another catalogue whose id differs', () => {
        const guess = {
          trackId: 'deezer-142986132',
          isrc: 'GBAHS1700028',
        } as GuessDto;
        expect(evaluateGuess(guess, spotifySide)).toBe(GuessResult.Correct);
      });

      it('ignores separators and case in the code', () => {
        const guess = {
          trackId: 'deezer-142986132',
          isrc: 'gb-ahs-17-00028',
        } as GuessDto;
        expect(evaluateGuess(guess, spotifySide)).toBe(GuessResult.Correct);
      });

      it('does not match a different recording of the same song', () => {
        const guess = {
          trackId: 'deezer-999',
          isrc: 'GBAHS1700099',
          trackName: 'Something Else',
          artistName: 'Someone Else',
        } as GuessDto;
        expect(evaluateGuess(guess, spotifySide)).toBe(GuessResult.Wrong);
      });

      it('falls through to name matching when either side has no ISRC', () => {
        const guess = {
          trackId: 'other',
          isrc: 'GBAHS1700028',
          trackName: 'Shape of You',
          artistName: 'Ed Sheeran',
        } as GuessDto;
        expect(evaluateGuess(guess, makeTrack({ isrc: undefined }))).toBe(
          GuessResult.Correct,
        );
      });

      it('does not treat two missing ISRCs as a match', () => {
        const guess = {
          trackId: 'other',
          trackName: 'Nothing Alike',
          artistName: 'Nobody',
        } as GuessDto;
        expect(evaluateGuess(guess, makeTrack({ isrc: undefined }))).toBe(
          GuessResult.Wrong,
        );
      });
    });

    it('ignores trailing punctuation left behind by stripping a suffix', () => {
      // Taylor titled it with the full stop. Removing "(Taylor's Version)"
      // leaves the guess without one, so the two differed by a single char.
      const guess = {
        trackId: 'other',
        trackName: "I Knew You Were Trouble (Taylor's Version)",
        artistName: 'Taylor Swift',
      } as GuessDto;
      const actual = makeTrack({
        name: 'I Knew You Were Trouble.',
        artistName: 'Taylor Swift',
      });

      expect(evaluateGuess(guess, actual)).toBe(GuessResult.Correct);
    });

    it('matches name and artist regardless of case', () => {
      const guess = {
        trackId: 'other',
        trackName: 'SHAPE OF YOU',
        artistName: 'ed sheeran',
      } as GuessDto;
      expect(evaluateGuess(guess, track)).toBe(GuessResult.Correct);
    });

    it('should return Skip when skip is true', () => {
      expect(evaluateGuess({ skip: true } as GuessDto, track)).toBe(
        GuessResult.Skip,
      );
    });

    it('should return Skip when trackId is missing', () => {
      expect(evaluateGuess({} as GuessDto, track)).toBe(GuessResult.Skip);
    });

    it('should return Correct on exact trackId match', () => {
      expect(
        evaluateGuess({ trackId: 'track-actual' } as GuessDto, track),
      ).toBe(GuessResult.Correct);
    });

    it('should return Correct on forgiving name+artist match (different version)', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'different-id',
            trackName: 'Shape of You (Acoustic)',
            artistName: 'Ed Sheeran',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Correct);
    });

    it('should return ARTIST with case-insensitive artist match', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'ed sheeran',
            albumName: 'Wrong Album',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Artist);
    });

    it('should return ALBUM with case-insensitive album match', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'Wrong Artist',
            albumName: '÷ (DIVIDE)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Album);
    });

    it('should return ARTIST_AND_ALBUM when both match', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong Song',
            artistName: 'ED SHEERAN',
            albumName: '÷ (divide)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.ArtistAndAlbum);
    });

    it('should return WRONG when nothing matches', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'Wrong',
            albumName: 'Wrong',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Wrong);
    });

    it('should handle null guess artistName', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            albumName: '÷ (Divide)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Album);
    });

    it('should handle null actual albumName', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'Ed Sheeran',
            albumName: 'Some Album',
          } as GuessDto,
          makeTrack({ albumName: undefined }),
        ),
      ).toBe(GuessResult.Artist);
    });

    it('should handle empty string artistName', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: '',
            albumName: '÷ (Divide)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Album);
    });

    it('should return WRONG when both artistName and albumName are empty', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: '',
            albumName: '',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Wrong);
    });
  });

  describe('addGuessToHistory', () => {
    const track = makeTrack();

    it('should append a guess to empty history', () => {
      const result = addGuessToHistory([], GuessResult.Wrong, track, {
        trackId: 'wrong',
        trackName: 'Guess Song',
        artistName: 'Guess Artist',
      } as GuessDto);
      expect(result).toHaveLength(1);
      expect(result[0].trackName).toBe('Guess Song');
      expect(result[0].result).toBe(GuessResult.Wrong);
    });

    // What the audit reads to tell a silent round from an unknown song.
    it("keeps the device's audio report with the guess", () => {
      const audio = {
        played: false,
        contextState: 'interrupted',
        sessionHeld: false,
      };

      const result = addGuessToHistory([], GuessResult.Skip, track, {
        skip: true,
        audio,
      } as GuessDto);

      expect(result[0].audio).toEqual(audio);
    });

    it('records no report when the client sent none', () => {
      const result = addGuessToHistory([], GuessResult.Skip, track, {
        skip: true,
      } as GuessDto);

      expect(result[0]).not.toHaveProperty('audio');
    });

    it('should use actual track name on correct guess', () => {
      const result = addGuessToHistory([], GuessResult.Correct, track, {
        trackId: track.id,
        trackName: 'Whatever',
      } as GuessDto);
      expect(result[0].trackName).toBe('Shape of You');
      expect(result[0].artistName).toBe('Ed Sheeran');
    });

    it('should not mutate existing history', () => {
      const existing = [
        {
          trackId: 'old',
          trackName: 'Old',
          artistName: 'Old',
          result: GuessResult.Wrong,
        },
      ];
      const result = addGuessToHistory(existing, GuessResult.Skip, track, {
        skip: true,
      } as GuessDto);
      expect(result).toHaveLength(2);
      expect(existing).toHaveLength(1);
    });
  });

  describe('calculateNextState', () => {
    it('should return WON when result is Correct', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Correct, 3);
      expect(status).toBe(GameStatus.WON);
      expect(gameOver).toBe(true);
    });

    it('should return LOST when max rounds reached', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Wrong, 6);
      expect(status).toBe(GameStatus.LOST);
      expect(gameOver).toBe(true);
    });

    it('should return PLAYING when still rounds remaining', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Wrong, 3);
      expect(status).toBe(GameStatus.PLAYING);
      expect(gameOver).toBe(false);
    });

    it('should return PLAYING on skip with rounds remaining', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Skip, 1);
      expect(status).toBe(GameStatus.PLAYING);
      expect(gameOver).toBe(false);
    });
  });

  describe('getSnippetDuration', () => {
    it('should return first duration for round 0', () => {
      expect(getSnippetDuration(0)).toBe(ROUND_DURATIONS[0]);
    });

    it('should return last duration for round >= MAX_ROUNDS', () => {
      expect(getSnippetDuration(10)).toBe(
        ROUND_DURATIONS[ROUND_DURATIONS.length - 1],
      );
    });
  });
});
