'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { GuessResultDto, MultiplayerRoundStateDto } from '@/sdk';
import type { GuessDto } from '@/sdk';
import type { GuessHistoryDto } from '@/sdk';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';
import { MultiplayerRoundStateDtoStatusEnum } from '@/sdk/models/MultiplayerRoundStateDto';

export function useSubmitMultiplayerGuess() {
  const queryClient = useQueryClient();

  return useMutation<
    GuessResultDto,
    Error,
    { roomId: string; guess: GuessDto }
  >({
    mutationFn: async ({ roomId, guess }) => {
      try {
        return await api.multiplayerControllerSubmitGuess({
          id: roomId,
          guessDto: guess,
        });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (result, { roomId, guess }) => {
      const current = queryClient.getQueryData<MultiplayerRoundStateDto>(
        queryKeys.multiplayer.round(roomId),
      );

      // Patched, not refetched, exactly as solo play does it. The preview link
      // is re-minted on every fetch, so refetching mid-song hands the player a
      // new url for the same audio and the waveform decodes all over again.
      //
      // Only while the song is still in play: the answer arrives with the
      // fetch, so flipping the status here first would mount the reveal card
      // on a round that has nothing to reveal yet.
      if (current && !result.gameOver) {
        const played: GuessHistoryDto = {
          trackId: guess.trackId ?? null,
          trackName: guess.trackName ?? null,
          artistName: guess.artistName ?? null,
          result: result.result as unknown as GuessHistoryDtoResultEnum,
        };

        queryClient.setQueryData<MultiplayerRoundStateDto>(
          queryKeys.multiplayer.round(roomId),
          {
            ...current,
            currentGuess: result.currentRound,
            snippetDuration: result.snippetDuration,
            status:
              result.status as unknown as MultiplayerRoundStateDtoStatusEnum,
            guesses: [...current.guesses, played],
            hints: result.hints ?? current.hints,
          },
        );
      }

      // The answer only comes with the finished round, and the next song needs
      // a fetch of its own either way.
      if (result.gameOver || !current) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.multiplayer.round(roomId),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.multiplayer.scoreboard(roomId),
      });
    },
  });
}
