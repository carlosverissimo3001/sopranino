'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { MultiplayerRoundStateDto } from '@/sdk';
import { MultiplayerRoundStateDtoStatusEnum } from '@/sdk';

export function useMultiplayerRound(
  roomId: string | undefined,
  socketConnected = false,
) {
  const queryClient = useQueryClient();
  // The round on screen, asked for by index: the server's own idea of the
  // current round moves on the moment a song ends, before its answer is seen.
  const shownRound = useRef<number | undefined>(undefined);

  const query = useQuery<MultiplayerRoundStateDto>({
    queryKey: queryKeys.multiplayer.round(roomId!),
    // Unwrapped, or the page shows the SDK's generic error text.
    queryFn: async () => {
      try {
        const state = await api.multiplayerControllerGetRoundState({
          id: roomId!,
          roundIndex: shownRound.current,
        });
        shownRound.current = state.roundIndex;
        return state;
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    enabled: !!roomId,
    /**
     * Only poll when the round is complete — waiting for other players
     * or room-level state changes. During active play the player drives
     * state via guess submissions, which patch the cache in place.
     * Skip polling entirely if socket is connected.
     */
    refetchInterval: (query) => {
      if (socketConnected) return false;
      const status = query.state.data?.status;
      if (!status) return false;
      return status !== MultiplayerRoundStateDtoStatusEnum.Playing
        ? 3000
        : false;
    },
  });

  const advanceRound = useCallback(() => {
    if (!roomId) return;
    const shown = queryClient.getQueryData<MultiplayerRoundStateDto>(
      queryKeys.multiplayer.round(roomId),
    )?.roundIndex;
    shownRound.current = shown === undefined ? undefined : shown + 1;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.multiplayer.round(roomId),
    });
  }, [roomId, queryClient]);

  return { ...query, advanceRound };
}
