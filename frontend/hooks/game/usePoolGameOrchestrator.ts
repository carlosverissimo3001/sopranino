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
  initialTrackGroupId,
}: {
  volume?: number;
  /** False to hold the first round until `start`: a page load must not mint a user. */
  autoStart?: boolean;
  /** The set a set's own page opens on; the player can still change it in place. */
  initialTrackGroupId?: string;
} = {}) {
  const queryClient = useQueryClient();
  const [lastGuessResult, setLastGuessResult] = useState<string | null>(null);
  /** True between asking for a new round and getting one, so the finished one
      cannot briefly reappear while the swap happens. */
  const [isResetting, setIsResetting] = useState(false);
  const { fameTier, setFameTier } = useFameTier();
  /** A decade or genre to draw from instead of the whole pool, picked in place. */
  const [trackGroupId, setTrackGroupId] = useState(initialTrackGroupId);
  /** The set the open round was drawn from, to say when a change waits. */
  const [roundGroupId, setRoundGroupId] = useState(initialTrackGroupId);

  const {
    sessionId,
    isLoading: sessionLoading,
    error: sessionError,
    startGameMutation,
  } = useGameSession(GameMode.All, {
    ...(initialTrackGroupId
      ? { trackGroupId: initialTrackGroupId }
      : { playlistId: POOL_PLAYLIST_ID }),
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
    (tier: FameTier, groupId: string | undefined) => {
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
      setRoundGroupId(groupId);
      startGameMutation.mutate(
        groupId
          ? { trackGroupId: groupId, fameTier: tier, mode: GameMode.All }
          : {
              playlistId: POOL_PLAYLIST_ID,
              fameTier: tier,
              mode: GameMode.All,
            },
        {
          // A set's round is cached under the set; this page reads the pool key.
          onSuccess: (data) =>
            queryClient.setQueryData(
              queryKeys.game.startedSessionForPlaylist(POOL_PLAYLIST_ID),
              data.sessionId,
            ),
          onSettled: () => setIsResetting(false),
        },
      );
    },
    [gameAudio, gameState, queryClient, startGameMutation],
  );

  const handlePlayAgain = useCallback(
    () => startNewRound(fameTier, trackGroupId),
    [startNewRound, fameTier, trackGroupId],
  );

  const untouched =
    gameState?.status === GameStateDtoStatusEnum.Playing &&
    gameState.guesses.length === 0;

  // Same rule as the tier: before a guess the song is swapped, after one the
  // new set waits for the next song.
  const handleTrackGroupChange = useCallback(
    (groupId: string | undefined) => {
      if (groupId === trackGroupId || isResetting) return;
      setTrackGroupId(groupId);
      if (untouched) startNewRound(fameTier, groupId);
    },
    [trackGroupId, isResetting, untouched, startNewRound, fameTier],
  );
  const start = handlePlayAgain;

  // Before a guess the song is swapped for one of the new tier; after one,
  // the round is kept and the tier waits for the next song.
  const handleFameTierChange = useCallback(
    (tier: FameTier) => {
      if (tier === fameTier || isResetting) return;
      setFameTier(tier);
      if (untouched) startNewRound(tier, trackGroupId);
    },
    [
      fameTier,
      setFameTier,
      untouched,
      startNewRound,
      isResetting,
      trackGroupId,
    ],
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
    // Our own flag, not the mutation's: in Strict Mode an orphaned observer
    // can report pending forever, which locked the pickers for good.
    isStarting: isResetting,
    trackGroupId,
    handleTrackGroupChange,
    /** A set picked mid-round, which applies from the next song. */
    trackGroupWaits:
      !!gameState && !isGameOver && trackGroupId !== roundGroupId,
    /** The set the song on screen came from, which a queued pick has not replaced yet. */
    playingTrackGroupId: gameState && !isGameOver ? roundGroupId : trackGroupId,
  };
}
