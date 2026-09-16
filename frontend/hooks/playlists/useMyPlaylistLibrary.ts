'use client';

import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/hooks/auth/useMe';
import { canImport } from '@/hooks/imports/useMyImports';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import {
  PlaylistItemKind,
  PlaylistSortBy,
  type MyPlaylistsDto,
  type PlaylistItemDto,
} from '@/sdk';

const PENDING_POLL_MS = 2000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/** A player's Spotify and imported playlists, in one list. */
export function useMyPlaylistLibrary(
  sortBy: PlaylistSortBy = PlaylistSortBy.Default,
) {
  const { data: user } = useMe();
  return useQuery<MyPlaylistsDto>({
    queryKey: queryKeys.imports.library(sortBy),
    queryFn: () => api.myPlaylistsControllerList({ sortBy }),
    enabled: canImport(user),
    staleTime: THIRTY_MINUTES,
    refetchInterval: (query) =>
      query.state.data?.items.some((item) => item.pending)
        ? PENDING_POLL_MS
        : false,
  });
}

/** Whether an item can start a round now. */
export function isPlayable(item: PlaylistItemDto): boolean {
  return (
    item.kind === PlaylistItemKind.Spotify ||
    (!item.pending && item.trackCount > 0)
  );
}
