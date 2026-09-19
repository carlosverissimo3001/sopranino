'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  addDays,
  differenceInSeconds,
  formatDistanceToNowStrict,
  startOfDay,
} from 'date-fns';

function tickFor(secondsLeft: number): number {
  if (secondsLeft <= 60) return 1000;
  if (secondsLeft <= 3600) return 15_000;
  return 60_000;
}

export function DailyChallengeCountdown() {
  const [next, setNext] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const tomorrow = startOfDay(addDays(new Date(), 1));
      const secondsLeft = Math.max(
        0,
        differenceInSeconds(tomorrow, new Date()),
      );

      if (secondsLeft <= 0) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.me.status });
      }

      setNext(formatDistanceToNowStrict(tomorrow, { roundingMethod: 'floor' }));
      timer = setTimeout(tick, tickFor(secondsLeft));
    };

    tick();
    return () => clearTimeout(timer);
  }, [queryClient]);

  if (!next) return null;

  return <>Next in {next}.</>;
}
