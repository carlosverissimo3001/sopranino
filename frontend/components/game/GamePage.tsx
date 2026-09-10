'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useGameOrchestrator } from '@/hooks/game/useGameOrchestrator';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RoundProgressBar } from './RoundProgressBar';
import { PlaySnippetButton } from './PlaySnippetButton';
import { SongRevealCard } from './SongRevealCard';
import { GuessHistoryList } from './GuessHistoryList';
import { AudioDebugPanel } from './AudioDebugPanel';
import { GameHeader } from './GameHeader';
import { GameTitle } from './GameTitle';
import { GuessInput } from './GuessInput';
import { HintPanel } from './HintPanel';
import { AlbumArtReveal } from './AlbumArtReveal';
import { useUserPreferences } from '@/hooks/user-preferences/useUserPreferences';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

interface GamePageProps {
  mode: GameMode;
  playlistId?: string;
  trackGroupId?: string;
  /** What a curated set calls itself, in place of the generic heading. */
  heading?: string;
}

export function GamePage({
  mode,
  playlistId,
  trackGroupId,
  heading,
}: GamePageProps) {
  const { volume, setVolume } = useVolume();
  const { data: preferences } = useUserPreferences();
  const showAlbumHint = preferences?.showAlbumHint ?? true;
  const showTextHints = preferences?.showTextHints ?? true;
  const reducedMotion = preferences?.reducedMotion ?? false;
  const showGuessHistory = preferences?.showGuessHistory ?? true;

  const {
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
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
    handlePlayAgain,
  } = useGameOrchestrator(mode, playlistId, { volume, trackGroupId });

  // Destructure gameAudio to avoid ref access warnings
  const {
    audioRef,
    fullAudioRef,
    isPlaying,
    playSnippet,
    pauseSnippet,
    snippetProgress,
    snippetPeaks,
  } = gameAudio;

  useWarnOnLeave(!!gameState && !isGameOver);

  const albumArtColor = useImageColor(
    isGameOver && gameState?.answer?.albumImageUrl
      ? gameState.answer.albumImageUrl
      : null,
  );

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

  if (error) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center p-4 sm:p-6"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1DB954] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  // Pre-cache album art through next/image pipeline so it's instant on reveal
  const preloadAlbumUrl =
    !isGameOver && gameState.albumImageUrl ? gameState.albumImageUrl : null;

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-y-auto"
      style={{ background: 'rgb(var(--bg))' }}
    >
      {preloadAlbumUrl && (
        <Image
          src={preloadAlbumUrl}
          alt=""
          width={1}
          height={1}
          priority
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          sizes="(max-width: 768px) 144px, 176px"
        />
      )}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
        }}
      />

      <motion.div
        variants={SHAKE_VARIANTS}
        animate={shouldShake && !reducedMotion ? 'shake' : ''}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col min-h-screen min-h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-0">
          <GameHeader
            mode={mode}
            playlist={playlist ?? null}
            stats={stats ?? null}
            volume={volume}
            onVolumeChange={setVolume}
          />

          {!isGameOver && (
            <GameTitle
              mode={mode}
              currentRound={gameState.currentRound}
              maxRounds={gameState.maxRounds}
              heading={heading}
            />
          )}

          <AudioDebugPanel />

          <audio
            ref={audioRef}
            src={gameState.previewUrl ?? undefined}
            preload="auto"
            crossOrigin="anonymous"
          />
          {isGameOver && gameState.previewUrl && (
            <audio
              ref={fullAudioRef}
              src={gameState.previewUrl}
              preload="auto"
              loop={false}
            />
          )}

          {!isGameOver && (
            <RoundProgressBar
              currentRound={gameState.currentRound}
              guesses={gameState.guesses}
              totalRounds={gameState.maxRounds}
              snippetSteps={gameState.snippetSteps}
              progress={snippetProgress}
              peaks={snippetPeaks}
              isPlaying={isPlaying}
            />
          )}

          {!isGameOver && showAlbumHint && (
            <AlbumArtReveal
              albumImageUrl={gameState.albumImageUrl}
              currentRound={gameState.currentRound}
              maxRounds={gameState.maxRounds}
            />
          )}

          {!isGameOver && (
            <PlaySnippetButton
              snippetDuration={gameState.snippetDuration}
              isPlaying={isPlaying}
              onPlay={playSnippet}
              onPause={pauseSnippet}
            />
          )}

          {!isGameOver && showTextHints && (
            <HintPanel
              hints={gameState.hints ?? []}
              currentRound={gameState.currentRound}
            />
          )}

          <AnimatePresence mode="wait">
            {isGameOver ? (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <SongRevealCard
                  status={gameState.status}
                  answer={gameState.answer}
                  previewUrl={gameState.previewUrl}
                  shareGameId={isDaily ? gameState.sessionId : null}
                  showViewStats={isDaily}
                  showPlayAgain={isPlaylist}
                  onPlayAgain={isPlaylist ? handlePlayAgain : undefined}
                  playlistExternalUrl={
                    isPlaylist && playlist ? playlist.externalUrl : null
                  }
                  playlistName={isPlaylist && playlist ? playlist.name : null}
                  playlistTotalTracks={
                    isPlaylist && playlist ? playlist.totalTracks : null
                  }
                  playlistImageUrl={
                    isPlaylist && playlist ? (playlist.imageUrl ?? null) : null
                  }
                  isFullSongPlaying={gameAudio.isFullSongPlaying}
                  onToggleFullSong={gameAudio.toggleFullSong}
                  rankTitle={gameState.rankTitle ?? null}
                />
              </motion.div>
            ) : (
              <div className="relative z-20">
                <GuessInput
                  search={spotifySearch}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  submitPending={submitPending}
                  gameMode={mode}
                />
              </div>
            )}
          </AnimatePresence>

          {showGuessHistory && (
            <GuessHistoryList
              guesses={gameState.guesses}
              isGameOver={!!isGameOver}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
