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
import { usePlaylistById } from '@/hooks/playlists/usePlaylistById';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

const ShouldShakeResult: GuessResult[] = [
  GuessResult.Wrong,
  GuessResult.Artist,
  GuessResult.Album,
  GuessResult.ArtistAndAlbum,
];

export function useGameOrchestrator(
  mode: GameMode,
  playlistId?: string,
  {
    volume = 0.8,
    trackGroupId,
  }: { volume?: number; trackGroupId?: string } = {},
) {
  const queryClient = useQueryClient();
  const [lastGuessResult, setLastGuessResult] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;

  const { data: playlist } = usePlaylistById(playlistId ?? '');
  const {
    sessionId,
    isLoading: sessionLoading,
    error: sessionError,
    startGameMutation,
  } = useGameSession(mode, playlistId, trackGroupId);
  const {
    data: gameState,
    isLoading: loadingState,
    error: errorState,
  } = useGameState(sessionId);
  const submitGuessMutation = useSubmitGuess();
  const spotifySearch = useSpotifyTrackSearch();
  const { data: stats } = useGameStats({ mode, useCached: false });

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

  const isLoading =
    isPlaylist || isDaily ? sessionLoading || loadingState : false;
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
      ...(isDaily ? [queryKeys.streak.status] : []),
    ];
    void Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  }, [isDaily, isGameOver, queryClient]);

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

  const handlePlayAgain = useCallback(() => {
    gameAudio.stopFullSong();
    setIsResetting(true);

    if (gameState?.sessionId) {
      queryClient.setQueryData(queryKeys.game.state(gameState.sessionId), null);
      queryClient.removeQueries({
        queryKey: queryKeys.game.state(gameState.sessionId),
      });
    }
    // Whichever key this round was started under, so "play again" does not
    // read back the session it is replacing.
    const sessionKey = trackGroupId
      ? queryKeys.game.startedSessionForGroup(trackGroupId)
      : playlistId
        ? queryKeys.game.startedSessionForPlaylist(playlistId)
        : null;

    if (sessionKey) {
      queryClient.setQueryData(sessionKey, null);
    }

    startGameMutation.reset();
    if (trackGroupId || playlistId) {
      startGameMutation.mutate(
        trackGroupId
          ? { trackGroupId, mode: GameMode.All }
          : { playlistId, mode: GameMode.All },
        { onSettled: () => setIsResetting(false) },
      );
    } else {
      setIsResetting(false);
    }
  }, [
    gameAudio,
    gameState,
    queryClient,
    startGameMutation,
    playlistId,
    trackGroupId,
  ]);

  const lastGuess = gameState?.guesses?.[gameState.guesses.length - 1];
  const shouldShake = lastGuess
    ? ShouldShakeResult.includes(lastGuess.result)
    : false;

  return {
    // State
    playlist,
    gameState,
    stats,
    isLoading,
    error,
    isGameOver,
    isPlaylist,
    isDaily,
    submitPending,
    shouldShake,
    // Sub-systems
    gameAudio,
    spotifySearch,
    // Handlers
    handleSubmit,
    handleSkip,
    handlePlayAgain,
  };
}
