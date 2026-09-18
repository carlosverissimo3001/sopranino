'use client';

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak?: number;
  className?: string;
}

export function StreakBadge({
  currentStreak,
  bestStreak,
  className = '',
}: StreakBadgeProps) {
  const isLarge = className.includes('text-3xl');
  // One line, and short enough for a phone's header: "3d · best 19".
  return (
    <div className={`flex items-center gap-1.5 whitespace-nowrap ${className}`}>
      <Flame
        aria-hidden
        className={
          isLarge ? 'h-7 w-7 text-orange-400' : 'h-4 w-4 text-orange-400'
        }
      />
      <span className={`font-semibold ${isLarge ? 'text-3xl' : ''}`}>
        {currentStreak}
        <span className={isLarge ? 'text-lg' : ''}>d</span>
      </span>
      <span className="sr-only">day streak</span>
      {bestStreak != null && bestStreak > 0 && (
        <span className={`text-fg/50 ${isLarge ? 'text-base' : 'text-sm'}`}>
          · best {bestStreak}
        </span>
      )}
    </div>
  );
}
