'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import { GuessHistoryDtoResultEnum as GuessResult } from '@/sdk/models/GuessHistoryDto';
import { queryKeys } from '@/lib/queryKeys';
import { POOL_PLAYLIST_ID } from '@/lib/consts';
import { useGameSession } from './useGameSession';
import { useGameState } from './useGameState';
import { useSubmitGuess } from './useSubmitGuess';
import { useGameAudio } from './useGameAudio';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';
import type { FameTier } from '../../sdk';
import { useFameTier } from './useFameTier';
import { currentFameTier } from '@/lib/fame-tier';

/**
 * Rounds drawn from the curated pool, for a player with no Spotify library to
 * play from. Same endpoints and same sub-systems as useGameOrchestrator; it
 * only leaves out what a pool round has no playlist or history to show.
 */
export function usePoolGameOrchestrator({
  volume = 0.8,
  autoStart = true,
}: {
  volume?: number;
  /** False to hold the first round until `start`: a page load must not mint a user. */
  autoStart?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const [lastGuessResult, setLastGuessResult] = useState<string | null>(null);
  /** True between asking for a new round and getting one, so the finished one
      cannot briefly reappear while the swap happens. */
  const [isResetting, setIsResetting] = useState(false);
  const { fameTier, setFameTier } = useFameTier();

  const {
    sessionId,
    isLoading: sessionLoading,
    error: sessionError,
    startGameMutation,
  } = useGameSession(GameMode.All, {
    playlistId: POOL_PLAYLIST_ID,
    fameTier: currentFameTier(),
    enabled: autoStart,
  });
  const {
    data: gameState,
    isLoading: loadingState,
    error: errorState,
  } = useGameState(sessionId);
  const submitGuessMutation = useSubmitGuess();
  const spotifySearch = useSpotifyTrackSearch();

  const isGameOver =
    !isResetting && gameState?.status !== GameStateDtoStatusEnum.Playing;
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
    if (!gameState?.guesses?.length) return;
    const last = gameState.guesses[gameState.guesses.length - 1];
    if (last.result !== lastGuessResult) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Tracking the last guess result for the shake animation
      setLastGuessResult(last.result);
    }
  }, [gameState?.guesses, lastGuessResult]);

  const handleSubmit = useCallback(() => {
    if (!gameState || submitPending) return;
    if (!spotifySearch.selectedTrack) return;
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
    if (!gameState || submitPending) return;
    submitGuessMutation.mutate({
      sessionId: gameState.sessionId,
      skip: true,
      audio: getAudioReport(),
    });
  }, [gameState, submitPending, submitGuessMutation, getAudioReport]);

  const startNewRound = useCallback(
    (tier: FameTier) => {
      gameAudio.stopFullSong();
      setIsResetting(true);
      setLastGuessResult(null);

      if (gameState?.sessionId) {
        queryClient.removeQueries({
          queryKey: queryKeys.game.state(gameState.sessionId),
        });
      }
      // setQueryData rather than removeQueries: useGameSession subscribes to this
      // key, and removing it would drop that subscription.
      queryClient.setQueryData(
        queryKeys.game.startedSessionForPlaylist(POOL_PLAYLIST_ID),
        null,
      );

      startGameMutation.reset();
      startGameMutation.mutate(
        { playlistId: POOL_PLAYLIST_ID, fameTier: tier, mode: GameMode.All },
        { onSettled: () => setIsResetting(false) },
      );
    },
    [gameAudio, gameState, queryClient, startGameMutation],
  );

  const handlePlayAgain = useCallback(
    () => startNewRound(fameTier),
    [startNewRound, fameTier],
  );
  const start = handlePlayAgain;

  // Before a guess the song is swapped for one of the new tier; after one,
  // the round is kept and the tier waits for the next song.
  const handleFameTierChange = useCallback(
    (tier: FameTier) => {
      if (tier === fameTier || startGameMutation.isPending) return;
      setFameTier(tier);
      const untouched =
        gameState?.status === GameStateDtoStatusEnum.Playing &&
        gameState.guesses.length === 0;
      if (untouched) startNewRound(tier);
    },
    [fameTier, setFameTier, gameState, startNewRound, startGameMutation],
  );

  const lastGuess = gameState?.guesses?.[gameState.guesses.length - 1];
  const shouldShake = lastGuess?.result === GuessResult.Wrong;

  return {
    gameState,
    isLoading,
    error,
    isGameOver,
    submitPending,
    shouldShake,
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
    handlePlayAgain,
    fameTier,
    handleFameTierChange,
    start,
    isStarting: startGameMutation.isPending,
  };
}
