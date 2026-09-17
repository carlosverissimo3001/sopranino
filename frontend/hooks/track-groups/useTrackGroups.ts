'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { ResponseError, TrackGroupControllerListTypeEnum } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';

/**
 * The curated sets anyone can play. Unlike playlists this needs no account, so
 * it is never gated on one.
 */
export function useTrackGroups(
  type: TrackGroupControllerListTypeEnum = TrackGroupControllerListTypeEnum.Decade,
) {
  return useQuery<TrackGroupDto[]>({
    queryKey: queryKeys.trackGroups.byType(type),
    queryFn: () => api.trackGroupControllerList({ type }),
    // Six rows that change when the pool is reseeded, which is not often.
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * One group by the name in its URL, so a shared link resolves without knowing
 * which kind of group it is.
 */
export function isNotFound(error: unknown): boolean {
  return error instanceof ResponseError && error.response.status === 404;
}

export function useTrackGroupBySlug(
  slug: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery<TrackGroupDto>({
    queryKey: queryKeys.trackGroups.bySlug(slug),
    queryFn: () => api.trackGroupControllerBySlug({ slug }),
    enabled: enabled && !!slug,
    // A missing set stays missing; anything else may be a passing hiccup.
    retry: (failures, error) => !isNotFound(error) && failures < 2,
    staleTime: 30 * 60 * 1000,
  });
}
