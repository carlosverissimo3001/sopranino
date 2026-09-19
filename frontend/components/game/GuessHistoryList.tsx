'use client';

import { getGuessResultStyle } from './guess-result-styles';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface Guess {
  trackId?: string | null;
  trackName?: string | null;
  albumName?: string | null;
  artistName?: string | null;
  result: GuessHistoryDtoResultEnum | null;
}

interface GuessHistoryListProps {
  guesses: Guess[];
  title?: string;
  isGameOver?: boolean;
}

type Row =
  | { type: 'guess'; index: number; guess: Guess }
  | { type: 'skip-group'; from: number; to: number };

function groupGuesses(guesses: Guess[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < guesses.length) {
    if (guesses[i].result === GuessHistoryDtoResultEnum.Skip) {
      const from = i;
      while (
        i < guesses.length &&
        guesses[i].result === GuessHistoryDtoResultEnum.Skip
      ) {
        i++;
      }
      rows.push({ type: 'skip-group', from, to: i - 1 });
    } else {
      rows.push({ type: 'guess', index: i, guess: guesses[i] });
      i++;
    }
  }
  return rows;
}

const albumMatched = (result: GuessHistoryDtoResultEnum | null) =>
  result === GuessHistoryDtoResultEnum.Album ||
  result === GuessHistoryDtoResultEnum.ArtistAndAlbum;

/**
 * A record of the round, so it sits lighter than the answer above it: plain
 * lines, and each thing said once. A set from one artist used to repeat the
 * artist and "Right artist" on every row.
 */
export function GuessHistoryList({
  guesses,
  isGameOver = false,
}: GuessHistoryListProps) {
  const showSection = guesses.length > 0 || !isGameOver;
  if (!showSection) return null;

  const rows = groupGuesses(guesses);
  let lastArtist: string | null | undefined;
  let lastLabel: string | undefined;

  return (
    <ol className="mt-4 space-y-1 px-1 sm:mt-5" aria-label="Your guesses">
      {rows.map((row) => {
        if (row.type === 'skip-group') {
          // A skip breaks the run, so the next guess says its artist again.
          lastArtist = undefined;
          lastLabel = undefined;
          const label =
            row.from === row.to
              ? `Round ${row.from + 1} skipped`
              : `Rounds ${row.from + 1}-${row.to + 1} skipped`;
          return (
            <li
              key={`skip-${row.from}-${row.to}`}
              className="py-0.5 pl-10 text-xs italic text-fg/30"
            >
              {label}
            </li>
          );
        }

        const { guess, index } = row;
        const style = getGuessResultStyle(guess.result);
        const showArtist =
          !!guess.artistName && guess.artistName !== lastArtist;
        const showLabel = style.label !== lastLabel;
        lastArtist = guess.artistName;
        lastLabel = style.label;

        return (
          <li
            key={`${index}-${guess.trackId}`}
            className="flex items-baseline gap-3 py-0.5 text-sm"
          >
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 self-center rounded-full ${style.dotClass}`}
            />
            <span className="w-3 shrink-0 text-right text-xs tabular-nums text-fg/30">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-fg/75">
              {guess.trackName ?? 'Unknown'}
              {showArtist && (
                <span className="text-fg/35"> - {guess.artistName}</span>
              )}
              {guess.albumName && albumMatched(guess.result) && (
                <span className="text-fg/35"> - {guess.albumName}</span>
              )}
            </span>
            {/* Repeated only when it changes; always there for a screen
                reader, since the dot's colour alone says nothing. */}
            <span
              className={`shrink-0 text-xs text-fg/40 ${showLabel ? '' : 'sr-only'}`}
            >
              {style.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
