'use client';

import { useMeStatus } from '@/hooks/me/useMeStatus';
import type { MeStatusDto } from '@/sdk';

const selectPlayedToday = (status: MeStatusDto) => ({
  playedToday: status.dailyPlayedToday,
});

/** Whether today's daily was finished, won or lost. */
export function usePlayedToday(options?: { enabled?: boolean }) {
  return useMeStatus(selectPlayedToday, {
    enabled: options?.enabled,
    // Around midnight the answer flips without anything else happening.
    refetchInterval: 60 * 1000,
  });
}
