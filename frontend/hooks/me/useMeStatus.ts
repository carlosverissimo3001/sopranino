'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { MeStatusDto } from '@/sdk';

/**
 * Streak, daily and speed run state in one request. The hooks that used to
 * ask for each are selectors over this, so a page with all three asks once.
 */
export function useMeStatus<T>(
  select: (status: MeStatusDto) => T,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: queryKeys.me.status,
    queryFn: () => api.meStatusControllerGet(),
    select,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}
