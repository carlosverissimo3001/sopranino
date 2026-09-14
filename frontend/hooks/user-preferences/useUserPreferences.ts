'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { UserPreferenceDto } from '@/sdk';

export const DEFAULT_PREFERENCES: UserPreferenceDto = {
  showAlbumHint: true,
  showTextHints: true,
  showGuessHistory: true,
  showStatsToOthers: false,
  timezone: 'UTC',
};

export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.userPreferences.me,
    queryFn: () => api.userPreferencesControllerGet(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data ?? DEFAULT_PREFERENCES,
  });
}
