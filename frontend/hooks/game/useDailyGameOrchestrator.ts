'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import { GuessHistoryDtoResultEnum as GuessResult } from '@/sdk/models/GuessHistoryDto';
import { queryKeys } from '@/lib/queryKeys';
import { useGameSession } from './useGameSession';
import { useGameState } from './useGameState';
import { useSubmitGuess } from './useSubmitGuess';
import { useGameAudio } from './useGameAudio';
import { useGameStats } from './useGameStats';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

/**
 * The daily round: one song a day, the same for everybody, resumed rather than
 * restarted. Everything else plays through usePoolGameOrchestrator.
 */
export function useDailyGameOrchestrator({
  volume = 0.8,
}: { volume?: number } = {}) {
  const mode = GameMode.Daily;
  const queryClient = useQueryClient();
  const [lastGuessResult, setLastGuessResult] = useState<string | null>(null);

  const {
    sessionId,
    isLoading: sessionLoading,
    error: sessionError,
  } = useGameSession(mode);
  const {
    data: gameState,
    isLoading: loadingState,
    error: errorState,
  } = useGameState(sessionId);
  const submitGuessMutation = useSubmitGuess();
  const spotifySearch = useSpotifyTrackSearch();
  const { data: stats } = useGameStats({ mode, useCached: false });

  const isGameOver = gameState?.status !== GameStateDtoStatusEnum.Playing;
  const gameAudio = useGameAudio({
    previewUrl: gameState?.previewUrl,
    isGameOver: !!isGameOver,
    snippetDuration: gameState?.snippetDuration ?? 0.5,
    maxSnippetDuration: gameState?.snippetSteps?.at(-1),
    volume,
  });
  const { getAudioReport } = gameAudio;

  const isLoading = sessionLoading || loadingState;
  const error = sessionError ?? errorState;
  const submitPending = submitGuessMutation.isPending;

  useEffect(() => {
    if (!gameState?.guesses?.length) {
      return;
    }
    const last = gameState.guesses[gameState.guesses.length - 1];
    if (last.result !== lastGuessResult) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Tracking the last guess result for the shake animation
      setLastGuessResult(last.result);
    }
  }, [gameState?.guesses, lastGuessResult]);

  useEffect(() => {
    if (!isGameOver) return;
    const keys = [
      queryKeys.game.allStats,
      queryKeys.game.playedToday,
      queryKeys.game.allHistory,
      queryKeys.daily.allHistory,
      queryKeys.streak.status,
    ];
    void Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  }, [isGameOver, queryClient]);

  const handleSubmit = useCallback(() => {
    if (!gameState || submitPending) {
      return;
    }
    if (!spotifySearch.selectedTrack) {
      return;
    }
    submitGuessMutation.mutate(
      {
        sessionId: gameState.sessionId,
        trackId: spotifySearch.selectedTrack.id,
        skip: false,
        trackName: spotifySearch.selectedTrack.name,
        artistName: spotifySearch.selectedTrack.artist,
        albumName: spotifySearch.selectedTrack.albumName,
        isrc: spotifySearch.selectedTrack.isrc,
        audio: getAudioReport(),
      },
      { onSuccess: () => spotifySearch.handleClearSelection() },
    );
  }, [
    gameState,
    submitPending,
    spotifySearch,
    submitGuessMutation,
    getAudioReport,
  ]);

  const handleSkip = useCallback(() => {
    if (!gameState || submitPending) {
      return;
    }
    submitGuessMutation.mutate({
      sessionId: gameState.sessionId,
      skip: true,
      audio: getAudioReport(),
    });
  }, [gameState, submitPending, submitGuessMutation, getAudioReport]);

  const lastGuess = gameState?.guesses?.[gameState.guesses.length - 1];
  const shouldShake = lastGuess?.result === GuessResult.Wrong;

  return {
    // State
    gameState,
    stats,
    isLoading,
    error,
    isGameOver,
    submitPending,
    shouldShake,
    // Sub-systems
    gameAudio,
    spotifySearch,
    // Handlers
    handleSubmit,
    handleSkip,
  };
}
