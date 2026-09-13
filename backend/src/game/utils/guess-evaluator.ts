import { GameStatus } from '@prisma/client';
import { GuessResult, MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { GuessDto } from '../dto/guess/guess.dto';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { normalizeText, normalizeTrackNameForMatch } from '../../utils/text';
import { TrackEntity } from '../../track/entities/track.entity';

/** ISRCs are sometimes written with separators (GB-UM7-10-29604). */
export function normalizeIsrc(value?: string | null): string {
  return (value || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/**
 * Evaluates a guess against the actual track.
 * Match on exact trackId, ISRC, OR normalized trackName + artistName.
 */
export function evaluateGuess(
  guess: GuessDto,
  actual: TrackEntity,
): GuessResult {
  const { trackId, skip } = guess;

  if (skip || !trackId) {
    return GuessResult.Skip;
  }

  if (trackId === actual.id) {
    return GuessResult.Correct;
  }

  // The guess and the answer can come from different catalogues, so ids won't
  // line up even when it's the same recording. ISRC is what survives the hop.
  const guessIsrc = normalizeIsrc(guess.isrc);
  if (guessIsrc && guessIsrc === normalizeIsrc(actual.isrc)) {
    return GuessResult.Correct;
  }

  // Forgiving match: same song, different version
  if (
    guess.trackName != null &&
    guess.trackName !== '' &&
    guess.artistName != null &&
    guess.artistName !== ''
  ) {
    const normName = normalizeTrackNameForMatch(guess.trackName).toLowerCase();
    const normArtist = normalizeText(guess.artistName).toLowerCase();
    if (
      normName === normalizeTrackNameForMatch(actual.name).toLowerCase() &&
      normArtist === normalizeText(actual.artistName).toLowerCase()
    ) {
      return GuessResult.Correct;
    }
  }

  const isArtistCorrect =
    guess.artistName != null &&
    normalizeText(guess.artistName).toLowerCase() ===
      normalizeText(actual.artistName).toLowerCase();
  const isAlbumCorrect =
    guess.albumName != null &&
    actual.albumName != null &&
    normalizeText(guess.albumName).toLowerCase() ===
      normalizeText(actual.albumName).toLowerCase();

  let result = GuessResult.Wrong;
  if (isArtistCorrect && isAlbumCorrect) {
    result = GuessResult.ArtistAndAlbum;
  } else if (isArtistCorrect) {
    result = GuessResult.Artist;
  } else if (isAlbumCorrect) {
    result = GuessResult.Album;
  }

  return result;
}

export function addGuessToHistory(
  existingGuesses: GuessHistoryDto[],
  result: GuessResult,
  actual: TrackEntity,
  guess: GuessDto,
): GuessHistoryDto[] {
  const history = [...existingGuesses];

  const trackName =
    result === GuessResult.Correct
      ? actual.name
      : (guess.trackName ?? 'Unknown');
  const artistName =
    result === GuessResult.Correct
      ? actual.artistName
      : (guess.artistName ?? 'Unknown');

  history.push({
    trackId: guess.trackId,
    trackName,
    artistName,
    result,
    ...(guess.audio && { audio: guess.audio }),
  });

  return history;
}

export function calculateNextState(
  result: GuessResult,
  nextRound: number,
): { status: GameStatus; gameOver: boolean } {
  if (result === GuessResult.Correct) {
    return { status: GameStatus.WON, gameOver: true };
  }

  if (nextRound >= MAX_ROUNDS) {
    return { status: GameStatus.LOST, gameOver: true };
  }

  return { status: GameStatus.PLAYING, gameOver: false };
}

export function getSnippetDuration(round: number): number {
  return ROUND_DURATIONS[Math.min(round, MAX_ROUNDS - 1)];
}
