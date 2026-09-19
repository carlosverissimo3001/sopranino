'use client';

import { useMeStatus } from '@/hooks/me/useMeStatus';
import type { MeStatusDto } from '@/sdk';

const selectStreak = (status: MeStatusDto) => status.streak;

/** Its playedToday means won today: the streak counts wins, not rounds. */
export function useStreakStatus(opts?: { enabled?: boolean }) {
  return useMeStatus(selectStreak, opts);
}
