'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { VolumeSlider } from '@/components/game/VolumeSlider';
import { SongRevealCard } from '@/components/game/SongRevealCard';
import { GameRoundView } from '@/components/game/GameRoundView';
import {
  GameScreenError,
  GameScreenLoading,
} from '@/components/game/GameScreenStatus';
import { useGameAudio } from '@/hooks/game/useGameAudio';
import { useVolume } from '@/hooks/game/useVolume';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { useMultiplayerRound } from '@/hooks/multiplayer/useMultiplayerRound';
import { useMultiplayerScoreboard } from '@/hooks/multiplayer/useMultiplayerScoreboard';
import { useMultiplayerSocket } from '@/hooks/multiplayer/useMultiplayerSocket';
import { ChatDock } from '@/components/multiplayer/ChatDock';
import { CHAT_ENABLED } from '@/lib/chat-socket';
import { useSubmitMultiplayerGuess } from '@/hooks/multiplayer/useSubmitMultiplayerGuess';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { RoomDtoStatusEnum } from '@/sdk';
import { FinishCountdownBanner } from './FinishCountdownBanner';
import { useRouter } from 'next/navigation';
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
  const {
    connected,
    hostDisconnected,
    messages,
    chatRefused,
    chatMuted,
    sendMessage,
  } = useMultiplayerSocket(roomId, {
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

  // The room can end without this player: the host finished and the window
  // ran out. Their round is over whether or not they were on its last song,
  // and guesses are refused from here on, so the results are where they go.
  const roomCompleted = room?.status === RoomDtoStatusEnum.Completed;

  useWarnOnLeave(!!roundState && !isGameOver && !roomCompleted);

  // Invalidate stats & history so they're fresh when the user navigates away.
  // The last round's reveal is not shown: the results page covers every round,
  // so lingering on one of them only delays where the player is going.
  useEffect(() => {
    if (!isGameOver) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.game.allStats });
    void queryClient.invalidateQueries({ queryKey: queryKeys.game.allHistory });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.me.status,
    });

    router.replace(`/multiplayer/${roomId}/results`);
  }, [isGameOver, queryClient, roomId, router]);

  useEffect(() => {
    if (!roomCompleted) return;
    router.replace(`/multiplayer/${roomId}/results`);
  }, [roomCompleted, roomId, router]);

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
    // Not on the last round: the results page is next, and the song would be
    // heard for the moment before the page goes.
    isGameOver: !!isRoundComplete && !isGameOver,
    snippetDuration: roundState?.snippetDuration ?? 0.5,
    volume,
  });
  const { getAudioReport } = gameAudio;

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
          audio: getAudioReport(),
        },
      },
      { onSuccess: () => spotifySearch.handleClearSelection() },
    );
  }, [roundState, submitGuessMutation, spotifySearch, roomId, getAudioReport]);

  const handleSkip = useCallback(() => {
    if (!roundState || submitGuessMutation.isPending) return;
    submitGuessMutation.mutate({
      roomId,
      guess: { skip: true, audio: getAudioReport() },
    });
  }, [roundState, submitGuessMutation, roomId, getAudioReport]);

  const handleNextRound = useCallback(() => {
    setTransitionKey((k) => k + 1);
    advanceRound();
  }, [advanceRound]);

  if (isLoading) return <GameScreenLoading />;
  if (error || !roundState) {
    return (
      <GameScreenError
        error={error}
        fallbackMessage="Failed to load game"
        backHref={`/multiplayer/${roomId}`}
        backLabel="Back to Lobby"
      />
    );
  }

  return (
    <>
      <GameRoundView
        round={{
          previewUrl: roundState.previewUrl,
          answerImageUrl: roundState.answer?.albumImageUrl,
          currentRound: roundState.currentGuess,
          maxRounds: roundState.maxGuessesPerSong,
          guesses: roundState.guesses,
          snippetSteps: roundState.snippetSteps,
          snippetDuration: roundState.snippetDuration,
          hints: roundState.hints,
        }}
        isOver={!!isRoundComplete}
        audio={gameAudio}
        showCover={false}
        roundKey={transitionKey}
        guess={{
          search: spotifySearch,
          onSubmit: handleSubmit,
          onSkip: handleSkip,
          submitPending: submitGuessMutation.isPending,
          gameMode: GameMode.Multiplayer,
        }}
        header={
          <>
            <AnimatePresence>
              {hostDisconnected && currentUserId !== room?.hostId && (
                <HostDisconnectedBanner />
              )}
            </AnimatePresence>
            <div className="mb-2 flex justify-end">
              <VolumeSlider volume={volume} onVolumeChange={setVolume} />
            </div>
            {/* Not to somebody who has finished: the host sees it for the
                moment between their last guess and the results otherwise. */}
            <FinishCountdownBanner
              deadline={isGameOver ? undefined : room?.finishDeadline}
            />
          </>
        }
        title={
          <>
            <RoundDots roundState={roundState} pastResults={pastResults} />
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-fg">
                Round {roundState.roundIndex + 1}{' '}
                <span className="text-fg/30 font-normal">
                  / {roundState.totalRounds}
                </span>
              </h2>
            </div>
          </>
        }
        reveal={
          isGameOver ? (
            // The results page is the destination; this only covers the hop.
            <div className="flex flex-col items-center gap-3 py-16">
              <LoadingSpinner size="md" />
              <p className="text-sm text-fg/50">Taking you to the results...</p>
            </div>
          ) : (
            <>
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
              <RoundScoreSummary
                roomId={roomId}
                roundIndex={roundState.roundIndex}
                myUserId={currentUserId}
              />
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
            </>
          )
        }
      />
      {/* With chat off, only the host keeps a dock, to turn it back on. */}
      {CHAT_ENABLED &&
        (room?.chatEnabled !== false || currentUserId === room?.hostId) && (
          <ChatDock
            messages={messages}
            players={room?.players}
            chatEnabled={room?.chatEnabled ?? true}
            isHost={currentUserId === room?.hostId}
            currentUserId={currentUserId}
            onSend={sendMessage}
            refused={chatRefused}
            muted={chatMuted}
            scope="round"
            channel={roomId}
          />
        )}
    </>
  );
}
