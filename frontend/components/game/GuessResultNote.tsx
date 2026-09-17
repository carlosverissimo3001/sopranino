'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';
import { getGuessResultStyle } from './guess-result-styles';
import { matchedName } from '@/lib/guess-match';

interface Guess {
  trackName?: string | null;
  artistName?: string | null;
  albumName?: string | null;
  result: GuessHistoryDtoResultEnum | null;
}

/**
 * How the last guess went, said once and gone. It floats rather than taking a
 * row, so a guess never moves the cover or the search.
 */
export function GuessResultNote({ guesses }: { guesses: Guess[] }) {
  const last = guesses.at(-1);
  const shown =
    last?.result && last.result !== GuessHistoryDtoResultEnum.Skip
      ? last
      : null;

  return (
    <div className="relative h-0" aria-live="polite">
      <AnimatePresence>
        {shown?.result && (
          <motion.div
            key={guesses.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], y: 0 }}
            transition={{ duration: 3.2, times: [0, 0.08, 0.85, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center px-4"
          >
            <span
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-lg shadow-black/40 backdrop-blur ${getGuessResultStyle(shown.result).badgeClass}`}
            >
              <span className="shrink-0">
                {getGuessResultStyle(shown.result).label}
              </span>
              {matchedName(shown) && (
                <span className="truncate font-normal opacity-80">
                  · {matchedName(shown)}
                </span>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
