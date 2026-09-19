'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { GameStateDto, StartGameDto } from '@/sdk';

/**
 * Starts a game session (playlist, set or daily). The answer is the game's
 * state, so it goes straight into the cache the round reads.
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
      // Anyone already known is still the same person.
      if (!queryClient.getQueryData(queryKeys.auth.me)) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
      // Nothing is invalidated under game.session: the state set above lives
      // there, and invalidating it would fetch what the start just returned.
    },
  });
}
