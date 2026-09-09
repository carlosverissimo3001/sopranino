import { MAX_ROUNDS, GuessResult } from '../consts';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';

const GUESS_MAPPER: Record<GuessResult, string> = {
  [GuessResult.Correct]: '🟩',
  [GuessResult.Artist]: '🟨',
  [GuessResult.Album]: '🟨',
  [GuessResult.ArtistAndAlbum]: '🟨',
  [GuessResult.Skip]: '⬜',
  [GuessResult.Wrong]: '🔇',
};

/**
 * Converts a guess result to its corresponding emoji for sharing
 */
export function guessToEmoji(result: GuessResult): string {
  return GUESS_MAPPER[result] || '🔇';
}

/** The host alone: a share is read in a chat bubble, and https:// buys nothing there. */
function shareHost(appUrl: string): string {
  return appUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

/**
 * Builds the shareable text for a completed daily game.
 *
 * Three lines, no blanks: it has to survive a tweet and a chat preview without
 * being truncated, and it must not name the track.
 */
export function buildShareText(params: {
  gameNumber: number;
  isWin: boolean;
  guesses: GuessHistoryDto[];
  appUrl: string;
}): string {
  const { gameNumber, isWin, guesses, appUrl } = params;

  const grid = guesses.map((g) => guessToEmoji(g.result)).join('');
  const attempts = isWin ? String(guesses.length) : 'X';

  return [
    `sopranino #${gameNumber} · ${attempts}/${MAX_ROUNDS}`,
    grid,
    `${shareHost(appUrl)}/daily`,
  ].join('\n');
}
