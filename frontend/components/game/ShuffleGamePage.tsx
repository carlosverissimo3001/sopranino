'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { usePoolGameOrchestrator } from '@/hooks/game/usePoolGameOrchestrator';
import { useMe } from '@/hooks/auth/useMe';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AudioDebugPanel } from './AudioDebugPanel';
import { RoundProgressBar } from './RoundProgressBar';
import { VolumeSlider } from './VolumeSlider';
import { PlaySnippetButton } from './PlaySnippetButton';
import { SongRevealCard } from './SongRevealCard';
import { ClaimNamePrompt } from './ClaimNamePrompt';
import { GuessHistoryList } from './GuessHistoryList';
import { GameTitle } from './GameTitle';
import { GuessInput } from './GuessInput';
import { HintPanel } from './HintPanel';
import { AlbumArtReveal } from './AlbumArtReveal';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * A round drawn from the curated pool rather than a playlist: the same
 * presentational components and the same endpoints, minus the playlist picker
 * and stats panel. Open to anyone — for a signed-out visitor, starting one is
 * also what mints their account.
 */
export function ShuffleGamePage({ canSignIn }: { canSignIn: boolean }) {
  const { volume, setVolume } = useVolume();
  const { data: user } = useMe();

  const {
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
  } = usePoolGameOrchestrator({ volume });

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
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        variants={SHAKE_VARIANTS}
        animate={shouldShake ? 'shake' : ''}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col min-h-screen min-h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-0">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <VolumeSlider volume={volume} onVolumeChange={setVolume} />
            </div>
            {/* Nothing at all while the site is gated: /api/auth/login is
                blocked without the access cookie, so offering it is a dead end. */}
            {canSignIn && !user?.hasAccount && (
              <a href="/api/auth/login" className="shrink-0">
                <Button
                  variant="outline"
                  className="!h-9 px-4 !rounded-full text-xs font-semibold"
                >
                  <Image
                    src="/spotify-icon.svg"
                    alt=""
                    width={14}
                    height={14}
                    // The icon ships dark and vanishes against the page.
                    className="mr-2 shrink-0 brightness-0 invert"
                  />
                  Sign in
                </Button>
              </a>
            )}
          </div>

          {!isGameOver && (
            <GameTitle
              mode={GameMode.All}
              currentRound={gameState.currentRound}
              maxRounds={gameState.maxRounds}
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

          {!isGameOver && (
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

          {!isGameOver && (
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
                  showPlayAgain
                  onPlayAgain={handlePlayAgain}
                  isFullSongPlaying={gameAudio.isFullSongPlaying}
                  onToggleFullSong={gameAudio.toggleFullSong}
                />
                <div className="mt-4 flex flex-col">
                  <ClaimNamePrompt />
                </div>
              </motion.div>
            ) : (
              <div className="relative z-20">
                <GuessInput
                  search={spotifySearch}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  submitPending={submitPending}
                  nextSnippetDuration={
                    gameState.snippetSteps[gameState.currentRound + 1]
                  }
                  gameMode={GameMode.All}
                />
              </div>
            )}
          </AnimatePresence>

          <GuessHistoryList
            guesses={gameState.guesses}
            isGameOver={!!isGameOver}
          />
        </div>
      </motion.div>
    </div>
  );
}
