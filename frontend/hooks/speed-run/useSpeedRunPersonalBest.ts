'use client';

import { useMeStatus } from '@/hooks/me/useMeStatus';
import type { MeStatusDto } from '@/sdk';

const selectBest = (status: MeStatusDto) => ({
  personalBest: status.speedRunBest,
});

export function usePersonalBest(enabled = true) {
  return useMeStatus(selectBest, { enabled });
}
