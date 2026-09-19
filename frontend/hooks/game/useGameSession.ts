'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useStartGame } from './useStartGame';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';
import type { FameTier } from '../../sdk';

/**
 * Handles game session initialization: starts playlist or daily game once on mount.
 *
 * SessionId is derived from two sources:
 *  1. mutation.data — set when the mutation observer receives the result (same mount).
 *  2. A useQuery subscription on a predictable cache key — the config-level onSuccess
 *     in useStartGame writes here, and the subscription triggers a re-render even if
 *     the mutation observer is orphaned by Strict Mode.
 */
export function useGameSession(
  mode: GameMode,
  {
    playlistId,
    trackGroupId,
    fameTier,
    enabled = true,
  }: {
    playlistId?: string;
    trackGroupId?: string;
    fameTier?: FameTier;
    /** False to wait for the caller to start a round, as the landing does. */
    enabled?: boolean;
  } = {},
) {
  const startGameMutation = useStartGame();
  const hasStarted = useRef(false);

  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;
  const shouldStart =
    enabled && ((isPlaylist && (!!playlistId || !!trackGroupId)) || isDaily);

  // Predictable cache key — known before the mutation completes
  const sessionCacheKey =
    isPlaylist && trackGroupId
      ? queryKeys.game.startedSessionForGroup(trackGroupId)
      : isPlaylist && playlistId
        ? queryKeys.game.startedSessionForPlaylist(playlistId)
        : queryKeys.game.startedSessionForDaily;

  // Subscribe to the cache key. `enabled: false` → never fetches, but the
  // observer still re-renders when setQueryData writes to this key.
  const { data: cachedSessionId } = useQuery<string | null>({
    queryKey: sessionCacheKey,
    queryFn: () => Promise.reject(new Error('cache-only')),
    enabled: false,
    retry: false,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shouldStart || hasStarted.current) return;
    hasStarted.current = true;

    // null, not undefined: setQueryData ignores undefined.
    queryClient.setQueryData(sessionCacheKey, null);

    startGameMutation.mutate(
      isPlaylist && trackGroupId
        ? { trackGroupId, fameTier, mode }
        : isPlaylist && playlistId
          ? { playlistId, fameTier, mode }
          : { mode },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStart]);

  // Until this visit's start has cleared the key, what it holds is the last
  // visit's round: shown, its reveal came back and played. After the clear,
  // anything written is this visit's, even the same id, as the daily gives.
  const ownCachedId =
    shouldStart && !hasStarted.current
      ? undefined
      : (cachedSessionId ?? undefined);
  const sessionId = startGameMutation.data?.sessionId ?? ownCachedId;
  const error = startGameMutation.error;
  const isLoading = shouldStart && !sessionId && !error;

  return {
    sessionId,
    isLoading,
    error: error ?? null,
    startGameMutation,
  };
}
