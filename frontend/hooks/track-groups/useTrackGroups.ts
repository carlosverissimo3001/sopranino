'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { ResponseError, TrackGroupControllerListTypeEnum } from '@/sdk';
import type { TrackGroupCatalogDto, TrackGroupDto } from '@/sdk';

const KEY_BY_TYPE = {
  [TrackGroupControllerListTypeEnum.Artist]: 'artist',
  [TrackGroupControllerListTypeEnum.Decade]: 'decade',
  [TrackGroupControllerListTypeEnum.Genre]: 'genre',
  [TrackGroupControllerListTypeEnum.Chart]: 'chart',
  [TrackGroupControllerListTypeEnum.Special]: 'special',
} as const satisfies Partial<
  Record<TrackGroupControllerListTypeEnum, keyof TrackGroupCatalogDto>
>;

export type ListedType = keyof typeof KEY_BY_TYPE;

/**
 * The curated sets anyone can play, one kind at a time. Every kind comes from
 * one request, so a picker showing all of them asks once. Unlike playlists
 * this needs no account, so it is never gated on one.
 */
export function useTrackGroups(
  type: ListedType = TrackGroupControllerListTypeEnum.Decade,
) {
  return useQuery({
    queryKey: queryKeys.trackGroups.catalog,
    queryFn: () => api.trackGroupControllerCatalog(),
    select: (catalog): TrackGroupDto[] => catalog[KEY_BY_TYPE[type]],
    // Rows that change when the pool is reseeded, which is not often.
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
