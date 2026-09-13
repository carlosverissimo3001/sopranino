'use client';

import { formatSeconds } from '@/lib/format-seconds';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { getGuessResultStyle } from './guess-result-styles';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface Guess {
  result: GuessHistoryDtoResultEnum | null;
}

interface RoundProgressBarProps {
  currentRound: number;
  guesses: Guess[];
  totalRounds: number;
  /** Snippet length per round. Without it the rounds are drawn equal width. */
  snippetSteps?: number[];
  /** 0–1 through the snippet now playing. */
  progress?: MotionValue<number>;
  /** Peak amplitudes of the track, 0–1. Flat bars are drawn until they arrive. */
  peaks?: number[];
  isPlaying?: boolean;
}

/**
 * The lit portion of the waveform, revealed left to right by the playhead.
 *
 * Done with a clip rather than by re-rendering the bars: the value changes
 * every frame, and clipping moves one element instead of ninety-six.
 */
function Playhead({
  progress,
  ceiling,
  children,
}: {
  progress: MotionValue<number>;
  ceiling: number;
  children: React.ReactNode;
}) {
  const clip = useTransform(
    progress,
    (value) => `inset(0 ${100 - value * ceiling * 100}% 0 0)`,
  );

  return (
    <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
      {children}
    </motion.div>
  );
}

function Bars({ peaks, lit }: { peaks: number[]; lit: boolean }) {
  return (
    <div className="flex h-full w-full items-center gap-px">
      {peaks.map((peak, index) => (
        <span
          key={index}
          className={`flex-1 rounded-full transition-[height] duration-500 ease-out ${
            lit
              ? 'bg-[#1DB954] shadow-[0_0_6px_rgba(29,185,84,0.45)]'
              : 'bg-fg/20'
          }`}
          // A floor so silence still draws a line rather than a gap.
          style={{ height: `${Math.max(peak, 0.08) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** Drawn until decoding finishes; real peaks then grow out of these. */
const PLACEHOLDER_PEAKS: number[] = Array.from({ length: 96 }, () => 0);

/**
 * The track's waveform doubling as the progress bar: lit is what you have
 * earned, ticks are what the next miss unlocks. Rests at the ceiling rather
 * than emptying, which is what makes the 0.1s round legible.
 */
export function RoundProgressBar({
  currentRound,
  guesses,
  totalRounds,
  snippetSteps,
  progress,
  peaks = [],
  isPlaying = false,
}: RoundProgressBarProps) {
  const steps =
    snippetSteps && snippetSteps.length === totalRounds
      ? snippetSteps
      : Array.from({ length: totalRounds }, (_, index) => index + 1);

  const longest = steps[steps.length - 1] || 1;
  const round = Math.min(currentRound, totalRounds - 1);
  const drawn = peaks.length > 0 ? peaks : PLACEHOLDER_PEAKS;

  /**
   * Square root, not linear: the steps span two orders of magnitude, so
   * proportional puts five rounds in the left third. Log over-corrects and
   * gives round one half the bar.
   */
  const position = (seconds: number) => Math.sqrt(seconds / longest);

  const ceiling = position(steps[round] ?? longest);

  return (
    // Same column as the content below, or it reads as a separate element.
    <div className="mx-auto w-full max-w-xl mb-4 sm:mb-6 md:mb-8">
      <div className="relative mb-1 h-3">
        {steps.map((step, index) => {
          const spent = index < currentRound;
          const isCurrent = index === round;
          // Ends are pinned; centring would hang them off the bar.
          const align =
            index === 0
              ? 'translate-x-0'
              : index === steps.length - 1
                ? '-translate-x-full'
                : '-translate-x-1/2';

          return (
            <span
              key={step}
              className={`absolute ${align} text-[10px] leading-none tabular-nums transition-colors ${
                isCurrent
                  ? 'font-semibold text-[#1DB954]'
                  : spent
                    ? 'text-fg/40'
                    : 'text-fg/25'
              }`}
              style={{ left: `${position(step) * 100}%` }}
            >
              {formatSeconds(step)}
            </span>
          );
        })}
      </div>
      {/* Fixed height: peaks land after the round loads and must not shift it. */}
      <div className="relative h-7 sm:h-9">
        <Bars peaks={drawn} lit={false} />
        {isPlaying && progress ? (
          <Playhead progress={progress} ceiling={ceiling}>
            <Bars peaks={drawn} lit />
          </Playhead>
        ) : (
          <div
            className="absolute inset-0 transition-[clip-path] duration-300"
            style={{ clipPath: `inset(0 ${100 - ceiling * 100}% 0 0)` }}
          >
            <Bars peaks={drawn} lit />
          </div>
        )}

        {/* What the next miss unlocks, coloured once spent. */}
        {steps.slice(0, -1).map((step, index) => {
          const result = guesses[index]?.result;
          const style = result != null ? getGuessResultStyle(result) : null;

          return (
            <span
              key={step}
              aria-hidden
              // Proud of the waveform so it reads as a marker, not a gap.
              className={`absolute -inset-y-1 w-0.5 rounded-full ${
                style?.barClass ?? 'bg-fg/40'
              }`}
              style={{ left: `${position(step) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
