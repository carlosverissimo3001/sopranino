'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HintDto, HintDtoTypeEnum as HintType } from '@/sdk';
import { Music, Calendar, Users, Disc3, Lightbulb } from 'lucide-react';

const HINT_ICONS: Record<HintType, React.ElementType> = {
  [HintType.Genre]: Music,
  [HintType.Decade]: Calendar,
  [HintType.Popularity]: Users,
  [HintType.Album]: Disc3,
};

interface HintPanelProps {
  hints: HintDto[];
  currentRound: number;
}

export function HintPanel({ hints, currentRound }: HintPanelProps) {
  if (currentRound === 0 && hints.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex items-center justify-center gap-2 mb-3 sm:mb-4 py-2 text-zinc-500 text-sm"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        <span>Every guess or skip unlocks a hint</span>
      </motion.div>
    );
  }

  const visibleHints = hints.filter((hint) => hint.value);

  if (!visibleHints.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 sm:mb-5 px-4">
      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mr-0.5">
        Hints
      </span>
      <AnimatePresence mode="popLayout">
        {visibleHints.map((hint, i) => {
          const Icon = HINT_ICONS[hint.type] ?? Music;
          return (
            <motion.div
              key={hint.type}
              layout
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              transition={{
                duration: 0.35,
                delay: i * 0.06,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="inline-flex max-w-full min-w-0 items-center gap-1.5 px-2.5 py-1.5 rounded-full
                bg-fg/10 border border-fg/[0.15]
                shadow-[0_0_8px_rgba(29,185,84,0.06)]"
            >
              <Icon className="w-3.5 h-3.5 shrink-0 text-[#1DB954]" />
              {/* No nowrap: one pill can hold a whole list of genres, and a
                  pill wider than the screen cannot wrap onto the next line. */}
              <span className="min-w-0 text-[13px] leading-snug text-fg/70">
                {hint.value}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
