'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RoundProgressBar } from '@/components/game/RoundProgressBar';
import { PlaySnippetButton } from '@/components/game/PlaySnippetButton';
import { VolumeSlider } from '@/components/game/VolumeSlider';
import { SongRevealCard } from '@/components/game/SongRevealCard';
import { GuessHistoryList } from '@/components/game/GuessHistoryList';
import { GuessInput } from '@/components/game/GuessInput';
import { useGameAudio } from '@/hooks/game/useGameAudio';
import { useVolume } from '@/hooks/game/useVolume';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { useMultiplayerRound } from '@/hooks/multiplayer/useMultiplayerRound';
import { useMultiplayerScoreboard } from '@/hooks/multiplayer/useMultiplayerScoreboard';
import { useMultiplayerSocket } from '@/hooks/multiplayer/useMultiplayerSocket';
import { useSubmitMultiplayerGuess } from '@/hooks/multiplayer/useSubmitMultiplayerGuess';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { useMe } from '@/hooks/auth/useMe';
import {
  MultiplayerRoundStateDtoStatusEnum,
  StartGameDtoModeEnum as GameMode,
  MultiplayerRoundStateDto,
} from '@/sdk';
import { ChevronRight } from 'lucide-react';
import { GLASS_STYLE } from '@/lib/styles';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { HostDisconnectedBanner } from './HostDisconnectedBanner';

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

interface MultiplayerGamePageProps {
  roomId: string;
}

/* ─── Round progress dots ─────────────────────────────────────── */

function RoundDots({
  roundState,
  pastResults,
}: {
  roundState: MultiplayerRoundStateDto;
  /** won/lost for each past round index, derived from the scoreboard */
  pastResults: Map<number, boolean>;
}) {
  const total = roundState.totalRounds;
  const current = roundState.roundIndex;
  const isCurrentComplete =
    roundState.status !== MultiplayerRoundStateDtoStatusEnum.Playing;

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current;
        const isCompleted = i < current || (isCurrent && isCurrentComplete);

        let dotColor = 'bg-fg/20'; // upcoming
        if (isCompleted) {
          const won = isCurrent
            ? roundState.status === MultiplayerRoundStateDtoStatusEnum.Won
            : (pastResults.get(i) ?? false);
          dotColor = won ? 'bg-[#1DB954]' : 'bg-red-500';
        }

        return (
          <motion.div
            key={i}
            className={`rounded-full ${isCurrent ? 'w-3 h-3' : 'w-2.5 h-2.5'} ${dotColor}`}
            {...(isCurrent &&
              !isCurrentComplete && {
                animate: {
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    '0 0 0px rgba(29,185,84,0.4)',
                    '0 0 10px rgba(29,185,84,0.8)',
                    '0 0 0px rgba(29,185,84,0.4)',
                  ],
                },
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              })}
          />
        );
      })}
    </div>
  );
}

/* ─── Mini-scoreboard shown between rounds ────────────────────── */

function RoundScoreSummary({
  roomId,
  roundIndex,
  myUserId,
}: {
  roomId: string;
  roundIndex: number;
  myUserId: string | undefined;
}) {
  const { data: scoreboard } = useMultiplayerScoreboard(roomId);

  const roundData = scoreboard?.rounds.find((r) => r.roundIndex === roundIndex);
  const myRoundResult = roundData?.players.find((p) => p.userId === myUserId);

  if (!myRoundResult) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      className="mt-5 p-4 rounded-xl text-center"
      style={GLASS_STYLE}
    >
      <p className="text-sm text-fg/50 mb-1">Your score this round</p>
      <p className="text-3xl font-black text-[#1DB954] tabular-nums">
        +{myRoundResult.score}
      </p>
      <p className="text-xs text-fg/30 mt-1">
        {myRoundResult.guessCount}{' '}
        {myRoundResult.guessCount === 1 ? 'guess' : 'guesses'}
      </p>
    </motion.div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */

export function MultiplayerGamePage({ roomId }: MultiplayerGamePageProps) {
  const { volume, setVolume } = useVolume();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitGuessMutation = useSubmitMultiplayerGuess();
  const spotifySearch = useSpotifyTrackSearch();
  const { data: me } = useMe();

  // Socket must come before useRoom so `connected` is available
  const currentUserIdRef = useRef<string | undefined>(undefined);
  const { connected, hostDisconnected } = useMultiplayerSocket(roomId, {
    // Only the round's first correct answer is worth saying out loud.
    // Narrating all twenty completions was noise whatever it cost.
    onPlayerRoundComplete: (data) => {
      if (data.isFirstSolve && data.userId !== currentUserIdRef.current) {
        toast(`${data.displayName} got round ${data.roundIndex + 1} first`, {
          duration: 3000,
        });
      }
    },
  });

  const { data: room, isLoading: roomLoading } = useRoom(roomId, connected);

  // Resolve current user's internal userId from the room player list
  const currentUserId = useMemo(() => {
    if (!me || !room) return undefined;
    return room.players.find((p) => p.userId === me.userId)?.userId;
  }, [me, room]);

  // Keep ref in sync for the socket callback
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const {
    data: roundState,
    isLoading: roundLoading,
    error: roundError,
    advanceRound,
  } = useMultiplayerRound(roomId, connected);
  const { data: scoreboard } = useMultiplayerScoreboard(roomId, connected);

  const [transitionKey, setTransitionKey] = useState(0);

  const isLoading = roundLoading || roomLoading;
  const error = roundError;

  const isRoundComplete =
    roundState?.status !== MultiplayerRoundStateDtoStatusEnum.Playing;
  const isGameOver =
    roundState &&
    roundState.roundIndex === roundState.totalRounds - 1 &&
    isRoundComplete;

  useWarnOnLeave(!!roundState && !isGameOver);

  // Invalidate stats & history so they're fresh when the user navigates away.
  // The last round's reveal is not shown: the results page covers every round,
  // so lingering on one of them only delays where the player is going.
  useEffect(() => {
    if (!isGameOver) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.game.allStats });
    void queryClient.invalidateQueries({ queryKey: queryKeys.game.allHistory });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.game.playedToday,
    });

    router.replace(`/multiplayer/${roomId}/results`);
  }, [isGameOver, queryClient, roomId, router]);

  // Derive past round results from scoreboard for the round dots
  const pastResults = useMemo(() => {
    const map = new Map<number, boolean>();
    if (!scoreboard || !currentUserId) return map;
    for (const round of scoreboard.rounds) {
      const myResult = round.players.find((p) => p.userId === currentUserId);
      if (myResult) map.set(round.roundIndex, myResult.won);
    }
    return map;
  }, [scoreboard, currentUserId]);

  const gameAudio = useGameAudio({
    previewUrl: roundState?.previewUrl,
    isGameOver: !!isRoundComplete,
    snippetDuration: roundState?.snippetDuration ?? 0.5,
    volume,
  });

  const {
    audioRef,
    fullAudioRef,
    isPlaying,
    playSnippet,
    pauseSnippet,
    snippetProgress,
    snippetPeaks,
  } = gameAudio;

  const albumArtColor = useImageColor(
    isRoundComplete && roundState?.answer?.albumImageUrl
      ? roundState.answer.albumImageUrl
      : null,
  );

  const handleSubmit = useCallback(() => {
    if (!roundState || submitGuessMutation.isPending) return;
    if (!spotifySearch.selectedTrack) return;

    submitGuessMutation.mutate(
      {
        roomId,
        guess: {
          trackId: spotifySearch.selectedTrack.id,
          trackName: spotifySearch.selectedTrack.name,
          artistName: spotifySearch.selectedTrack.artist,
          albumName: spotifySearch.selectedTrack.albumName,
          isrc: spotifySearch.selectedTrack.isrc,
          skip: false,
        },
      },
      { onSuccess: () => spotifySearch.handleClearSelection() },
    );
  }, [roundState, submitGuessMutation, spotifySearch, roomId]);

  const handleSkip = useCallback(() => {
    if (!roundState || submitGuessMutation.isPending) return;
    submitGuessMutation.mutate({
      roomId,
      guess: { skip: true },
    });
  }, [roundState, submitGuessMutation, roomId]);

  const handleNextRound = useCallback(() => {
    setTransitionKey((k) => k + 1);
    advanceRound();
  }, [advanceRound]);

  if (isLoading) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !roundState) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center p-4 sm:p-6"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load game'}
          </p>
          <Link
            href={`/multiplayer/${roomId}`}
            className="text-[#1DB954] hover:underline text-sm"
          >
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-y-auto"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          opacity: [0.6, 1, 0.6],
          background: [
            `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
            `radial-gradient(ellipse 130% 90% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 90% 90% at 20% 80%, rgba(29, 185, 84, 0.08) 0%, transparent 45%)`,
            `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        variants={SHAKE_VARIANTS}
        animate={false}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col min-h-screen min-h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-0">
          {/* Host disconnected warning */}
          <AnimatePresence>
            {hostDisconnected && currentUserId !== room?.hostId && (
              <HostDisconnectedBanner />
            )}
          </AnimatePresence>

          {/* Chrome, not part of the round: kept out of the play area. */}
          <div className="mb-2 flex justify-end">
            <VolumeSlider volume={volume} onVolumeChange={setVolume} />
          </div>

          {/* Round dots */}
          <RoundDots roundState={roundState} pastResults={pastResults} />

          {/* Round title */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-fg">
              Round {roundState.roundIndex + 1}{' '}
              <span className="text-fg/30 font-normal">
                / {roundState.totalRounds}
              </span>
            </h2>
          </div>

          {/* The results page is the destination; this only covers the hop. */}
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <LoadingSpinner size="md" />
              <p className="text-sm text-fg/50">Taking you to the results...</p>
            </motion.div>
          )}

          <audio
            ref={audioRef}
            // `||`, not `??`: the API sends '' when no audio could be minted,
            // and an empty src makes the browser refetch the page.
            src={roundState.previewUrl || undefined}
            preload="auto"
            crossOrigin="anonymous"
          />
          {isRoundComplete && roundState.previewUrl && (
            <audio
              ref={fullAudioRef}
              src={roundState.previewUrl}
              preload="auto"
              loop={false}
            />
          )}

          {!isRoundComplete && (
            <RoundProgressBar
              currentRound={roundState.currentGuess}
              guesses={roundState.guesses}
              totalRounds={roundState.maxGuessesPerSong}
              snippetSteps={roundState.snippetSteps}
              progress={snippetProgress}
              peaks={snippetPeaks}
              isPlaying={isPlaying}
            />
          )}

          {!isRoundComplete && (
            <PlaySnippetButton
              snippetDuration={roundState.snippetDuration}
              isPlaying={isPlaying}
              onPlay={playSnippet}
              onPause={pauseSnippet}
            />
          )}

          <AnimatePresence mode="wait">
            {isGameOver ? null : isRoundComplete ? (
              <motion.div
                key={`reveal-${transitionKey}`}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1"
              >
                <SongRevealCard
                  status={roundState.status}
                  answer={roundState.answer}
                  previewUrl={roundState.previewUrl}
                  shareGameId={null}
                  showViewStats={false}
                  showPlayAgain={false}
                  isFullSongPlaying={gameAudio.isFullSongPlaying}
                  onToggleFullSong={gameAudio.toggleFullSong}
                />

                {/* Player's own score for this round */}
                <RoundScoreSummary
                  roomId={roomId}
                  roundIndex={roundState.roundIndex}
                  myUserId={currentUserId}
                />

                {/* Next Round */}
                {!isGameOver && (
                  <div className="mt-6 flex justify-center">
                    <motion.button
                      onClick={handleNextRound}
                      className="group flex items-center gap-2 px-8 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-colors"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Next Round
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`guess-${transitionKey}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <GuessInput
                  search={spotifySearch}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  submitPending={submitGuessMutation.isPending}
                  gameMode={GameMode.Multiplayer}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <GuessHistoryList
            guesses={roundState.guesses}
            isGameOver={!!isRoundComplete}
          />
        </div>
      </motion.div>
    </div>
  );
}
