'use client';

import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 15 };

const TONES = {
  green: 'bg-[#1DB954] text-black hover:bg-[#1ed760]',
  orange: 'bg-orange-500 text-white hover:bg-orange-400',
};

interface PlaySnippetButtonProps {
  snippetDuration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  /** The speed run keeps its own colour. */
  tone?: keyof typeof TONES;
  disabled?: boolean;
  className?: string;
}

export function PlaySnippetButton({
  snippetDuration,
  isPlaying,
  onPlay,
  onPause,
  tone = 'green',
  disabled = false,
  className = 'mb-4 sm:mb-6',
}: PlaySnippetButtonProps) {
  const duration = snippetDuration;

  return (
    <div className={`text-center ${className}`}>
      <div className="inline-flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <motion.button
            type="button"
            disabled={disabled}
            whileHover={{ scale: 1.05, transition: SPRING }}
            whileTap={{ scale: 0.95, transition: SPRING }}
            aria-label={
              isPlaying ? `Pause snippet` : `Play ${duration} second snippet`
            }
            onClick={isPlaying ? onPause : onPlay}
            // Icon only: the bar above carries the duration now, and the
            // label changing width between states made the row jump.
            className={`relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full touch-manipulation disabled:opacity-40 ${TONES[tone]}`}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
            ) : (
              <motion.span whileHover={{ rotate: 10 }} transition={SPRING}>
                {/* Nudged right: a triangle centred on its bounding box reads
                    as sitting left of centre. */}
                <Play
                  className="h-6 w-6 sm:h-7 sm:w-7 translate-x-px"
                  fill="currentColor"
                />
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
