'use client';

import { useState, useCallback } from 'react';
import { DailyGamePage } from '@/components/game/DailyGamePage';
import { StreakFreezePrompt } from '@/components/streak/StreakFreezePrompt';
import { useStreakStatus } from '@/hooks/streak/useStreakStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DailyPage() {
  const { data: status, isLoading } = useStreakStatus();
  const [promptResolved, setPromptResolved] = useState(false);
  const resolvePrompt = useCallback(() => setPromptResolved(true), []);

  // While loading streak status, show a brief spinner
  if (isLoading) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show freeze prompt before the game if streak is at risk
  if (status?.streakAtRisk && !promptResolved) {
    return <StreakFreezePrompt onResolved={resolvePrompt} />;
  }

  return <DailyGamePage />;
}
