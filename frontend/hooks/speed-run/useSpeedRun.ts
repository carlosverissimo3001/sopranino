'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/sdk/client';
import { getApiErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/queryKeys';
import type { StartRunDto, StartRunDtoDifficultyEnum } from '@/sdk';
import { SNIPPET_STEPS } from '@/lib/snippet-timeline';

export type GauntletPhase = 'IDLE' | 'PLAYING' | 'ENDED';

export interface RecentTrack {
  name: string;
  artistName: string;
  albumArt?: string;
  position: number;
}

interface GauntletRunState {
  phase: GauntletPhase;
  runId: string | null;
  score: number;
  difficulty: StartRunDtoDifficultyEnum | null;
  previewUrl: string | null;
  snippetDuration: number;
  isNewPersonalBest: boolean;
  isNewDailyBest: boolean;
  recentTracks: RecentTrack[];
  /** Every song guessed right, from the server once the run is over. */
  guessedTracks: RecentTrack[] | null;
  gameOverTrack: { name: string; artistName: string; albumArt?: string } | null;
}

const INITIAL_STATE: GauntletRunState = {
  phase: 'IDLE',
  runId: null,
  score: 0,
  difficulty: null,
  previewUrl: null,
  snippetDuration: SNIPPET_STEPS[3],
  isNewPersonalBest: false,
  isNewDailyBest: false,
  recentTracks: [],
  guessedTracks: null,
  gameOverTrack: null,
};

type GuessParams = {
  trackId?: string;
  skip?: boolean;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  isrc?: string;
};

export function useGauntletRun() {
  const [state, setState] = useState<GauntletRunState>(INITIAL_STATE);
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: async (startRunDto: StartRunDto) => {
      try {
        return await api.gauntletControllerStartRun({ startRunDto });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (data) => {
      setState({
        ...INITIAL_STATE,
        phase: 'PLAYING',
        runId: data.runId,
        score: data.score,
        difficulty: data.difficulty as StartRunDtoDifficultyEnum,
        previewUrl: data.previewUrl || null,
        snippetDuration: data.snippetDuration,
      });
    },
  });

  const guessMutation = useMutation({
    mutationFn: async (params: GuessParams) => {
      if (!state.runId) throw new Error('No active run');
      try {
        return await api.gauntletControllerSubmitGuess({
          id: state.runId,
          submitGauntletGuessDto: {
            trackId: params.trackId,
            skip: params.skip,
            trackName: params.trackName,
            artistName: params.artistName,
            albumName: params.albumName,
            isrc: params.isrc,
          },
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (result) => {
      if (result.runOver) {
        setState((prev) => ({
          ...prev,
          phase: 'ENDED',
          score: result.score,
          isNewPersonalBest: result.isNewPersonalBest ?? false,
          isNewDailyBest: result.isNewDailyBest ?? false,
          guessedTracks:
            result.guessedTracks?.map((track, i) => ({
              name: track.name,
              artistName: track.artistName,
              albumArt: track.albumArt ?? undefined,
              position: i + 1,
            })) ?? null,
          gameOverTrack: result.actualTrack
            ? {
                name: result.actualTrack.name,
                artistName: result.actualTrack.artistName,
                albumArt: result.actualTrack.albumArt ?? undefined,
              }
            : null,
        }));
        // Invalidate personal best so the banner/setup refreshes
        void queryClient.invalidateQueries({
          queryKey: queryKeys.gauntlet.personalBest,
        });
      } else {
        setState((prev) => ({
          ...prev,
          score: result.score,
          previewUrl: result.nextPreviewUrl ?? prev.previewUrl,
          snippetDuration: result.nextSnippetDuration ?? prev.snippetDuration,
          recentTracks: [
            ...prev.recentTracks.slice(-5),
            {
              name: result.actualTrack?.name ?? '?',
              artistName: result.actualTrack?.artistName ?? '?',
              albumArt: result.actualTrack?.albumArt ?? undefined,
              position: result.score,
            },
          ],
        }));
      }
    },
  });

  const endMutation = useMutation({
    mutationFn: async () => {
      if (!state.runId) return;
      try {
        await api.gauntletControllerEndRun({ id: state.runId });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () => {
      setState((prev) => ({ ...prev, phase: 'ENDED' }));
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gauntlet.personalBest,
      });
    },
  });

  const startRun = useCallback(
    (startRunDto: StartRunDto) => startMutation.mutate(startRunDto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startMutation.mutate],
  );

  const submitGuess = useCallback(
    (params: GuessParams, options?: { onSuccess?: () => void }) =>
      guessMutation.mutate(params, { onSuccess: options?.onSuccess }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guessMutation.mutate],
  );

  const endRun = useCallback(
    () => endMutation.mutate(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endMutation.mutate],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    ...state,
    startRun,
    submitGuess,
    endRun,
    reset,
    isStarting: startMutation.isPending,
    isSubmitting: guessMutation.isPending,
    isEnding: endMutation.isPending,
    startError: startMutation.error?.message,
    guessError: guessMutation.error?.message,
  };
}
