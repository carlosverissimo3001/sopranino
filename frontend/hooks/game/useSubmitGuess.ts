'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type {
  GuessResultDto,
  GuessDto,
  GameStateDto,
  GuessHistoryDto,
  GuessAudioDto,
} from '@/sdk';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface SubmitGuessParams {
  sessionId: string;
  trackId?: string;
  skip?: boolean;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  isrc?: string;
  audio?: GuessAudioDto;
}

/**
 * Mutation hook to submit a guess or skip a round
 * Implements optimistic updates for better UX
 */
export function useSubmitGuess() {
  const queryClient = useQueryClient();

  return useMutation<
    GuessResultDto,
    Error,
    SubmitGuessParams,
    { previousState?: GameStateDto }
  >({
    mutationFn: async ({
      sessionId,
      trackId,
      skip = false,
      trackName,
      artistName,
      albumName,
      isrc,
      audio,
    }) => {
      const guessDto: GuessDto = {
        trackId: trackId || undefined,
        skip,
        trackName,
        artistName,
        albumName,
        isrc,
        audio,
      };
      return api.gameControllerSubmitGuess({ id: sessionId, guessDto });
    },
    onMutate: async ({ sessionId, trackId, skip, trackName, artistName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.game.state(sessionId),
      });

      // Snapshot the previous value
      const previousState = queryClient.getQueryData<GameStateDto>(
        queryKeys.game.state(sessionId),
      );

      // Optimistically update the game state (trackName/artistName from search selection)
      if (previousState) {
        const optimisticGuess: GuessHistoryDto = {
          trackId: trackId ?? null,
          trackName: trackName ?? null,
          artistName: artistName ?? null,
          // ONLY set a result if it's a skip. Otherwise, leave it null (I know it's f*cking ugly).
          result: skip
            ? GuessHistoryDtoResultEnum.Skip
            : (null as unknown as GuessHistoryDtoResultEnum),
        };

        queryClient.setQueryData<GameStateDto>(
          queryKeys.game.state(sessionId),
          {
            ...previousState,
            guesses: [...previousState.guesses, optimisticGuess],
          },
        );
      }

      return { previousState };
    },
    onSuccess: (result, variables) => {
      // Update the game state with the actual result
      const currentState = queryClient.getQueryData<GameStateDto>(
        queryKeys.game.state(variables.sessionId),
      );

      if (currentState) {
        // Update the last guess with the real result
        const updatedGuesses = [...currentState.guesses];
        if (updatedGuesses.length > 0) {
          updatedGuesses[updatedGuesses.length - 1] = {
            ...updatedGuesses[updatedGuesses.length - 1],
            result: result.result,
          };
        }

        const updatedState: GameStateDto = {
          ...currentState,
          currentRound: result.currentRound,
          snippetDuration: result.snippetDuration,
          status: result.status,
          guesses: updatedGuesses,
          hints: result.hints ?? currentState.hints,
          choices: result.choices ?? currentState.choices,
        };

        queryClient.setQueryData<GameStateDto>(
          queryKeys.game.state(variables.sessionId),
          updatedState,
        );

        // If game is over, refetch to get the answer
        if (result.gameOver) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.game.state(variables.sessionId),
          });
        }
      }
    },
    onError: (_error, variables, context) => {
      if (context?.previousState != null) {
        queryClient.setQueryData<GameStateDto>(
          queryKeys.game.state(variables.sessionId),
          context.previousState,
        );
      }
      toast.error('Failed to submit guess. Please try again.');
    },
  });
}
