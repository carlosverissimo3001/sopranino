'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

const STAGGER_DELAY = 0.06;

const ITEM_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as const,
      delay: i * STAGGER_DELAY,
    },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

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

export function GuessHistoryList({
  guesses,
  isGameOver = false,
}: GuessHistoryListProps) {
  const showSection = guesses.length > 0 || !isGameOver;
  if (!showSection) return null;

  const rows = groupGuesses(guesses);

  return (
    <div className="relative z-0 mt-4 sm:mt-5">
      <motion.div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {rows.map((row, rowIdx) => {
            const staggerIndex = rows.length - 1 - rowIdx;

            if (row.type === 'skip-group') {
              const count = row.to - row.from + 1;
              const label =
                count === 1
                  ? `Round ${row.from + 1} skipped`
                  : `Rounds ${row.from + 1}–${row.to + 1} skipped`;

              return (
                <motion.div
                  key={`skip-${row.from}-${row.to}`}
                  variants={ITEM_VARIANTS}
                  initial="initial"
                  animate="animate"
                  custom={staggerIndex}
                  exit="exit"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-fg/[0.05]"
                >
                  {count === 1 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 bg-fg/10 text-fg/40">
                      {row.from + 1}
                    </span>
                  )}
                  <p className="min-w-0 flex-1 text-sm text-fg/30 italic">
                    {label}
                  </p>
                </motion.div>
              );
            }

            const { guess, index } = row;
            const style = getGuessResultStyle(guess.result);

            return (
              <motion.div
                key={`${index}-${guess.trackId}-${guess.result}`}
                variants={ITEM_VARIANTS}
                initial="initial"
                animate="animate"
                custom={staggerIndex}
                exit="exit"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-fg/[0.07] border border-fg/[0.10]"
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${style.dotClass} text-black`}
                >
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 text-sm sm:text-base text-fg/90">
                  <span className="font-medium">{guess.trackName ?? '—'}</span>
                  {guess.artistName && (
                    <span className="text-fg/40">
                      {' · '}
                      {guess.artistName}
                    </span>
                  )}
                  {/* Named only where the album is what matched. */}
                  {guess.albumName &&
                    (guess.result === GuessHistoryDtoResultEnum.Album ||
                      guess.result ===
                        GuessHistoryDtoResultEnum.ArtistAndAlbum) && (
                      <span className="text-fg/40">
                        {' · '}
                        {guess.albumName}
                      </span>
                    )}
                </p>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-fg/50">
                  {style.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
