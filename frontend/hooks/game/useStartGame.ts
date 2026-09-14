'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { GameStateDto, StartGameDto } from '@/sdk';

/**
 * Mutation hook to start a new game session (playlist or daily).
 * On success, invalidates and sets the game state query.
 */
export function useStartGame() {
  const queryClient = useQueryClient();

  return useMutation<GameStateDto, Error, StartGameDto>({
    mutationFn: async (params: StartGameDto) => {
      try {
        const startGameDto: StartGameDto = {
          playlistId: params.playlistId,
          trackGroupId: params.trackGroupId,
          fameTier: params.fameTier,
          mode: params.mode,
        };
        return await api.gameControllerStartGame({ startGameDto });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data, variables) => {
      // Set the game state in cache immediately
      queryClient.setQueryData<GameStateDto>(
        queryKeys.game.state(data.sessionId),
        data,
      );
      // Persist sessionId under a predictable key so it survives
      // Strict Mode double-fires and component remounts
      const sessionKey = variables.trackGroupId
        ? queryKeys.game.startedSessionForGroup(variables.trackGroupId)
        : variables.playlistId
          ? queryKeys.game.startedSessionForPlaylist(variables.playlistId)
          : queryKeys.game.startedSessionForDaily;
      queryClient.setQueryData(sessionKey, data.sessionId);
      // A first round mints the guest, so "who is this" has a new answer.
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      // Invalidate related queries
      void queryClient.invalidateQueries({
        queryKey: queryKeys.game.session(data.sessionId),
      });
    },
  });
}
