import { GuessResult } from '../consts';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { buildShareText, guessToEmoji } from './share.utils';

const guesses = (...results: GuessResult[]): GuessHistoryDto[] =>
  results.map((result) => ({ result }));

const build = (overrides: Partial<Parameters<typeof buildShareText>[0]> = {}) =>
  buildShareText({
    gameNumber: 142,
    isWin: true,
    guesses: guesses(GuessResult.Wrong, GuessResult.Wrong, GuessResult.Correct),
    appUrl: 'https://unpause.vercel.app',
    ...overrides,
  });

describe('guessToEmoji', () => {
  it('reads as a music game, not a word game', () => {
    expect(guessToEmoji(GuessResult.Wrong)).toBe('🔇');
  });

  it('collapses every kind of near miss into one glyph', () => {
    expect(guessToEmoji(GuessResult.Artist)).toBe('🟨');
    expect(guessToEmoji(GuessResult.Album)).toBe('🟨');
    expect(guessToEmoji(GuessResult.ArtistAndAlbum)).toBe('🟨');
  });

  it('distinguishes a skip from a wrong answer', () => {
    expect(guessToEmoji(GuessResult.Skip)).toBe('⬜');
    expect(guessToEmoji(GuessResult.Correct)).toBe('🟩');
  });
});

describe('buildShareText', () => {
  it('is three lines with no blanks, so a chat preview shows all of it', () => {
    expect(build()).toBe(
      'sopranino #142 · 3/6\n🔇🔇🟩\nunpause.vercel.app/daily',
    );
  });

  it('counts guesses used, not points', () => {
    expect(build({ guesses: guesses(GuessResult.Correct) })).toContain('1/6');
  });

  it('marks a loss with X rather than a count', () => {
    expect(
      build({
        isWin: false,
        guesses: guesses(
          GuessResult.Wrong,
          GuessResult.Skip,
          GuessResult.Artist,
          GuessResult.Wrong,
          GuessResult.Wrong,
          GuessResult.Wrong,
        ),
      }),
    ).toBe('sopranino #142 · X/6\n🔇⬜🟨🔇🔇🔇\nunpause.vercel.app/daily');
  });

  it('carries nothing that could spoil the answer', () => {
    const guessedTrack: GuessHistoryDto[] = [
      {
        trackId: 'track-1',
        trackName: 'Where Have You Been',
        artistName: 'Rihanna',
        result: GuessResult.Correct,
      },
    ];
    const text = build({ guesses: guessedTrack });

    expect(text).not.toContain('Where Have You Been');
    expect(text).not.toContain('Rihanna');
  });

  it('drops the scheme and any trailing slash from the link', () => {
    expect(build({ appUrl: 'https://unpaused.example.com/' })).toContain(
      '\nunpaused.example.com/daily',
    );
    expect(build({ appUrl: 'http://localhost:3000' })).toContain(
      '\nlocalhost:3000/daily',
    );
  });
});
