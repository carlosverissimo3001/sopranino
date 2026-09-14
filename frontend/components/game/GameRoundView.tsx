'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useImageColor } from '@/hooks/misc/useImageColor';
import type { useGameAudio } from '@/hooks/game/useGameAudio';
import { useUserPreferences } from '@/hooks/user-preferences/useUserPreferences';
import type { GuessHistoryDtoResultEnum, HintDto, TrackOptionDto } from '@/sdk';
import { AlbumArtReveal } from './AlbumArtReveal';
import { AudioDebugPanel } from './AudioDebugPanel';
import { GuessHistoryList } from './GuessHistoryList';
import { GuessInput, type GuessSearchState } from './GuessInput';
import { HintPanel } from './HintPanel';
import { PlaySnippetButton } from './PlaySnippetButton';
import { RoundProgressBar } from './RoundProgressBar';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export interface RoundGuess {
  trackId?: string | null;
  trackName?: string | null;
  artistName?: string | null;
  result: GuessHistoryDtoResultEnum | null;
}

/** What every mode knows about the song being guessed. */
export interface RoundData {
  previewUrl?: string | null;
  /** The cover to blur. Absent where a mode does not send it mid-round. */
  albumImageUrl?: string | null;
  /** The answer's cover, which tints the background once the round is over. */
  answerImageUrl?: string | null;
  currentRound: number;
  maxRounds: number;
  guesses: RoundGuess[];
  snippetSteps: number[];
  snippetDuration: number;
  hints?: HintDto[];
  choices?: TrackOptionDto[];
}

export interface RoundGuessControls {
  search: GuessSearchState;
  onSubmit: () => void;
  onSkip: () => void;
  submitPending: boolean;
  gameMode: GameMode;
}

interface GameRoundViewProps {
  round: RoundData;
  isOver: boolean;
  shouldShake?: boolean;
  audio: ReturnType<typeof useGameAudio>;
  guess: RoundGuessControls;
  header: ReactNode;
  /** Above the progress bar. The page decides whether it stays once over. */
  title?: ReactNode;
  /** Takes the guess box's place once the round is over. */
  reveal: ReactNode;
  /** Changes per song, so a new round's reveal animates in again. */
  roundKey?: string | number;
  /** Multiplayer sends no cover mid-round, so it gets the play button. */
  showCover?: boolean;
  /** No round has been started yet: play starts one, and there is nothing to guess. */
  idle?: boolean;
}

/**
 * How a round looks while it is played, for every mode that plays rounds. Each
 * page owns its data, its header and what the reveal says; the round is here.
 */
export function GameRoundView({
  round,
  isOver,
  shouldShake = false,
  audio,
  guess,
  header,
  title,
  reveal,
  roundKey = 0,
  showCover = true,
  idle = false,
}: GameRoundViewProps) {
  const { data: preferences } = useUserPreferences();
  const cover = showCover && (preferences?.showAlbumHint ?? true);
  const showTextHints = preferences?.showTextHints ?? true;
  const showGuessHistory = preferences?.showGuessHistory ?? true;

  const {
    audioRef,
    fullAudioRef,
    isPlaying,
    playSnippet,
    pauseSnippet,
    snippetProgress,
    snippetPeaks,
  } = audio;

  const albumArtColor = useImageColor(isOver ? round.answerImageUrl : null);

  // Pre-cache the cover through next/image so it is instant on reveal.
  const preloadAlbumUrl = !isOver ? round.albumImageUrl : null;

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
        animate={shouldShake ? 'shake' : ''}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col min-h-screen min-h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {header}
          {title}

          <AudioDebugPanel />

          {/* `||`, not `??`: an empty src makes the browser refetch the page. */}
          <audio
            ref={audioRef}
            src={round.previewUrl || undefined}
            preload="auto"
            crossOrigin="anonymous"
          />
          {isOver && round.previewUrl && (
            <audio
              ref={fullAudioRef}
              src={round.previewUrl}
              preload="auto"
              loop={false}
            />
          )}

          {!isOver && (
            <RoundProgressBar
              currentRound={round.currentRound}
              guesses={round.guesses}
              totalRounds={round.maxRounds}
              snippetSteps={round.snippetSteps}
              progress={snippetProgress}
              peaks={snippetPeaks}
              isPlaying={isPlaying}
            />
          )}

          <div
            className={
              isOver ? 'contents' : 'flex min-h-0 flex-1 flex-col sm:contents'
            }
          >
            {!isOver && cover && (
              <AlbumArtReveal
                albumImageUrl={round.albumImageUrl}
                currentRound={round.currentRound}
                maxRounds={round.maxRounds}
                isPlaying={isPlaying}
                onPlay={playSnippet}
                onPause={pauseSnippet}
                idle={idle}
              />
            )}

            {!isOver && (
              <div className={cover ? 'hidden sm:block' : undefined}>
                <PlaySnippetButton
                  snippetDuration={round.snippetDuration}
                  isPlaying={isPlaying}
                  onPlay={playSnippet}
                  onPause={pauseSnippet}
                />
              </div>
            )}

            {!isOver && showTextHints && (
              <HintPanel
                hints={round.hints ?? []}
                currentRound={round.currentRound}
              />
            )}
          </div>

          <AnimatePresence mode="wait">
            {isOver ? (
              <motion.div
                key={`reveal-${roundKey}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {reveal}
              </motion.div>
            ) : (
              <div
                key={`guess-${roundKey}`}
                className="sticky bottom-0 z-20 order-last -mx-3 mt-auto bg-[rgb(var(--bg))] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:relative sm:order-none sm:mx-0 sm:mt-0 sm:bg-transparent sm:p-0"
              >
                <GuessInput
                  pinned
                  search={guess.search}
                  onSubmit={guess.onSubmit}
                  onSkip={guess.onSkip}
                  submitPending={guess.submitPending}
                  nextSnippetDuration={
                    round.snippetSteps[round.currentRound + 1]
                  }
                  choices={round.choices}
                  gameMode={guess.gameMode}
                  disabled={idle}
                />
              </div>
            )}
          </AnimatePresence>

          {showGuessHistory && (
            <GuessHistoryList guesses={round.guesses} isGameOver={isOver} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
