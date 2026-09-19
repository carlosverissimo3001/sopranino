'use client';

import { useQuery } from '@tanstack/react-query';
import { meQuery } from '@/hooks/auth/useMe';
import type { AuthMeResponseDto, UserPreferenceDto } from '@/sdk';

export const DEFAULT_PREFERENCES: UserPreferenceDto = {
  showAlbumHint: true,
  showTextHints: true,
  showGuessHistory: true,
  showStatsToOthers: false,
  timezone: 'UTC',
};

const selectPreferences = (me: AuthMeResponseDto | null) =>
  me?.preferences ?? DEFAULT_PREFERENCES;

/** Part of /auth/me, so a page that knows who is playing already has them. */
export function useUserPreferences() {
  return useQuery({ ...meQuery, select: selectPreferences });
}
