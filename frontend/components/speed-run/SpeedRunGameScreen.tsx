'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Flame, Trophy, RotateCcw, Home } from 'lucide-react';
import { GuessInput } from '@/components/game/GuessInput';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { useGauntletAudio } from '@/hooks/speed-run/useSpeedRunAudio';
import { VolumeSlider } from '@/components/game/VolumeSlider';
import type {
  useGauntletRun,
  RecentTrack,
} from '@/hooks/speed-run/useSpeedRun';
import { GameStatsDtoModeEnum as GameMode } from '@/sdk';

const MILESTONES = [5, 10, 15, 20];

function getFireEmojis(score: number): string {
  if (score >= 20) return '🔥🔥🔥🔥';
  if (score >= 15) return '🔥🔥🔥';
  if (score >= 10) return '🔥🔥';
  if (score >= 5) return '🔥';
  return '';
}

interface SpeedRunGameScreenProps {
  run: ReturnType<typeof useGauntletRun>;
  volume: number;
  onVolumeChange: (v: number) => void;
  personalBest: number;
}

export function SpeedRunGameScreen({
  run,
  volume,
  onVolumeChange,
  personalBest,
}: SpeedRunGameScreenProps) {
  const search = useSpotifyTrackSearch();
  const prevScoreRef = useRef(run.score);
  const hasShownMilestoneRef = useRef<Set<number>>(new Set());

  const audio = useGauntletAudio({
    previewUrl: run.previewUrl,
    snippetDuration: run.snippetDuration,
    volume,
    runEnded: run.phase === 'ENDED',
  });
  const { audioRef, fullAudioRef, isPlaying, playSnippet, pauseSnippet } =
    audio;

  useEffect(() => {
    if (run.score > prevScoreRef.current) {
      prevScoreRef.current = run.score;
      if (
        MILESTONES.includes(run.score) &&
        !hasShownMilestoneRef.current.has(run.score)
      ) {
        hasShownMilestoneRef.current.add(run.score);
      }
    }
  }, [run.score]);

  const handleSubmit = useCallback(() => {
    if (!search.selectedTrack) return;
    run.submitGuess({
      trackId: search.selectedTrack.id,
      trackName: search.selectedTrack.name,
      artistName: search.selectedTrack.artist,
      isrc: search.selectedTrack.isrc,
    });
    search.handleClearSelection();
  }, [run, search]);

  const handleSkip = useCallback(() => {
    run.submitGuess({ skip: true });
    search.handleClearSelection();
  }, [run, search]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseSnippet();
    } else {
      playSnippet();
    }
  }, [isPlaying, pauseSnippet, playSnippet]);

  const isEnded = run.phase === 'ENDED';
  const fires = getFireEmojis(run.score);
  const isNewBest = run.score > personalBest || run.isNewPersonalBest;

  return (
    <div className="relative flex flex-col gap-5">
      {/* Volume is global and persisted, so a run can start silent because a
          normal game was muted days ago. Without this the page gives no way to
          find that out. */}
      <div className="flex justify-end">
        <VolumeSlider volume={volume} onVolumeChange={onVolumeChange} />
      </div>

      {/* hidden audio elements */}
      <audio ref={audioRef} src={run.previewUrl ?? undefined} preload="auto" />
      <audio
        ref={fullAudioRef}
        src={run.previewUrl ?? undefined}
        preload="none"
      />

      {/* ── Score counter ── */}
      {!isEnded && (
        <div className="text-center pt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-fg/30 mb-1">
            Score
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={run.score}
              initial={{ scale: 1.5, opacity: 0, y: -12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="text-7xl sm:text-8xl font-black tabular-nums leading-none"
              style={
                run.score >= 10
                  ? {
                      backgroundImage:
                        'linear-gradient(135deg, #fb923c, #ef4444)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }
                  : {}
              }
            >
              {run.score}
            </motion.div>
          </AnimatePresence>

          {/* Fire emojis */}
          <AnimatePresence>
            {fires && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl mt-1 select-none"
              >
                {fires}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personal best comparison */}
          {personalBest > 0 && (
            <p className="text-xs text-fg/30 mt-1">
              Best:{' '}
              <span className="text-fg/50 font-semibold">{personalBest}</span>
              {run.score > 0 && run.score >= personalBest && (
                <span className="ml-1 text-orange-400 font-bold">← new!</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── Audio player ── */}
      {!isEnded && (
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={handlePlayPause}
            disabled={!run.previewUrl || isEnded}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
              isPlaying
                ? 'bg-orange-500 shadow-orange-500/30'
                : 'bg-fg/10 hover:bg-fg/15 border border-fg/10'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7" fill="white" color="white" />
            ) : (
              <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
            )}
          </motion.button>

          <p className="text-xs text-fg/30 font-medium">
            {run.snippetDuration}s snippet
            {run.difficulty && (
              <span className="ml-1 text-fg/20">
                · {run.difficulty.toLowerCase()}
              </span>
            )}
          </p>
        </div>
      )}

      {!isEnded && (
        <GuessInput
          search={search}
          gameMode={GameMode.Gauntlet}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          submitPending={run.isSubmitting}
        />
      )}

      {run.recentTracks.length > 0 && !isEnded && (
        <RecentHistory tracks={run.recentTracks} />
      )}

      <AnimatePresence>
        {isEnded && (
          <GameOverPanel
            score={run.score}
            personalBest={personalBest}
            isNewBest={isNewBest}
            isNewDailyBest={run.isNewDailyBest}
            gameOverTrack={run.gameOverTrack}
            recentTracks={run.recentTracks}
            onPlayAgain={run.reset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RecentHistory({ tracks }: { tracks: RecentTrack[] }) {
  const displayed = [...tracks].reverse().slice(0, 6);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-fg/30">
        Recent
      </p>
      <div className="flex flex-wrap gap-2">
        {displayed.map((t, i) => (
          <motion.div
            key={`${t.position}-${i}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-fg/5 border border-fg/10 text-xs"
          >
            <span className="text-spotify-green">✓</span>
            <span className="text-fg/60 truncate max-w-[100px]">{t.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GameOverPanel({
  score,
  personalBest,
  isNewBest,
  isNewDailyBest,
  gameOverTrack,
  recentTracks,
  onPlayAgain,
}: {
  score: number;
  personalBest: number;
  isNewBest: boolean;
  isNewDailyBest: boolean;
  gameOverTrack: { name: string; artistName: string; albumArt?: string } | null;
  recentTracks: RecentTrack[];
  onPlayAgain: () => void;
}) {
  const router = useRouter();
  const bestScore = Math.max(score, personalBest);

  useEffect(() => {
    if (isNewBest && score > 0) {
    }
  }, [isNewBest, score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col gap-5 pt-2"
    >
      {/* Run over label */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-fg/30 mb-3">
          Run over
        </p>

        {/* Celebrations */}
        {isNewBest && score > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 font-bold text-sm text-black"
            style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
          >
            <Trophy className="w-4 h-4" />
            New personal best!
          </motion.div>
        )}
        {!isNewBest && isNewDailyBest && score > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 font-bold text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30"
          >
            New daily best!
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-fg/5 border border-fg/10">
          <p className="text-xs font-bold uppercase tracking-widest text-fg/30">
            Score
          </p>
          <p className="text-4xl font-black tabular-nums">{score}</p>
        </div>
        <div className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-fg/5 border border-fg/10">
          <p className="text-xs font-bold uppercase tracking-widest text-fg/30 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
            Best
          </p>
          <p className="text-4xl font-black tabular-nums">{bestScore}</p>
        </div>
      </div>

      {/* The track they failed on */}
      {gameOverTrack && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-fg/30">
            It was…
          </p>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            {gameOverTrack.albumArt ? (
              <Image
                src={gameOverTrack.albumArt}
                alt=""
                width={48}
                height={48}
                className="rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-fg/10 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-fg truncate">{gameOverTrack.name}</p>
              <p className="text-sm text-fg/50 truncate">
                {gameOverTrack.artistName}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Songs you got right */}
      {recentTracks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-fg/30">
            Songs you got
          </p>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {[...recentTracks].reverse().map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-fg/60"
              >
                <span className="text-spotify-green text-xs">✓</span>
                <span className="font-medium text-fg/70 truncate">
                  {t.name}
                </span>
                <span className="text-fg/30 truncate text-xs">
                  {t.artistName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        <motion.button
          onClick={() => router.push('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-2xl font-semibold text-sm text-fg/50 bg-fg/[0.06] border border-fg/10 hover:text-fg/70 hover:bg-fg/10 transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </motion.button>
        <motion.button
          onClick={onPlayAgain}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3.5 rounded-2xl font-black text-base text-white tracking-tight shadow-[0_0_24px_rgba(251,146,60,0.25)] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </motion.button>
      </div>
    </motion.div>
  );
}
