'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

interface GameTitleProps {
  mode: GameMode;
  currentRound: number;
  maxRounds: number;
  /** What a curated set calls itself, in place of the generic heading. */
  heading?: string;
}

export function GameTitle({
  mode,
  currentRound,
  maxRounds,
  heading,
}: GameTitleProps) {
  if (mode === GameMode.All) {
    return (
      <div className="text-center mb-4 md:mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold tracking-tight text-fg"
          style={{
            letterSpacing: '-0.02em',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          {heading ?? 'Guess the Song'}
        </h1>
        <p className="text-[#b3b3b3] text-sm font-medium mt-1">
          Round {Math.min(currentRound + 1, maxRounds)} of {maxRounds}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center mb-4 md:mb-6">
      <h1
        className="text-2xl md:text-3xl font-bold mb-2 tracking-tight text-fg"
        style={{
          letterSpacing: '-0.02em',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}
      >
        Daily Challenge
      </h1>
      <p className="text-[#b3b3b3] flex items-center justify-center gap-2 text-sm md:text-base font-medium">
        <motion.span whileHover={{ rotate: 10 }}>
          <Calendar className="w-4 h-4 inline-block" />
        </motion.span>
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}
