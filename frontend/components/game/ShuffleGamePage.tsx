'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { usePoolGameOrchestrator } from '@/hooks/game/usePoolGameOrchestrator';
import { useMe } from '@/hooks/auth/useMe';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { Button } from '@/components/ui/button';
import { SNIPPET_STEPS } from '@/lib/snippet-timeline';
import { SongRevealCard } from './SongRevealCard';
import { ClaimNamePrompt } from './ClaimNamePrompt';
import { GameHeader } from './GameHeader';
import { ShuffleModeNav } from './ShuffleModeNav';
import { FameTierPicker } from './FameTierPicker';
import { GameRoundView, type RoundData } from './GameRoundView';
import { GameScreenError, GameScreenLoading } from './GameScreenStatus';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

/** A decoded track can take a moment; past this the element path is tried. */
const AUTOPLAY_WAIT_MS = 2500;

const IDLE_ROUND: RoundData = {
  previewUrl: null,
  albumImageUrl: null,
  currentRound: 0,
  maxRounds: SNIPPET_STEPS.length,
  guesses: [],
  snippetSteps: [...SNIPPET_STEPS],
  snippetDuration: SNIPPET_STEPS[0],
  hints: [],
};

interface ShuffleGamePageProps {
  canSignIn: boolean;
  /**
   * Waits for a tap before starting, then plays the snippet from it. The
   * landing needs this: `/` is crawled, and a page load must not mint a user.
   */
  deferStart?: boolean;
  /** In place of the Spotify sign-in, for a page with its own way in. */
  headerTrailing?: ReactNode;
  /** Read by crawlers and screen readers; the round heads itself on screen. */
  heading?: string;
  /** Under the reveal, once a round is over. */
  afterReveal?: ReactNode;
}

/**
 * A round drawn from the curated pool rather than a playlist. Open to anyone:
 * for a signed-out visitor, starting one is also what mints their account.
 */
export function ShuffleGamePage({
  canSignIn,
  deferStart = false,
  headerTrailing,
  heading = 'Shuffle: guess the song from a snippet',
  afterReveal,
}: ShuffleGamePageProps) {
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
    fameTier,
    handleFameTierChange,
    start,
    isStarting,
    trackGroupId,
    handleTrackGroupChange,
    trackGroupWaits,
  } = usePoolGameOrchestrator({ volume, autoStart: !deferStart });

  useWarnOnLeave(!!gameState && !isGameOver);

  // The tap that started the round asked to hear it, so it plays once ready.
  const playWhenReady = useRef(false);
  const { playSnippet, snippetPeaks } = gameAudio;
  const previewUrl = gameState?.previewUrl;
  useEffect(() => {
    if (!playWhenReady.current || !previewUrl) return;
    const play = () => {
      if (!playWhenReady.current) return;
      playWhenReady.current = false;
      playSnippet();
    };
    if (snippetPeaks.length > 0) {
      play();
      return;
    }
    const timer = setTimeout(play, AUTOPLAY_WAIT_MS);
    return () => clearTimeout(timer);
  }, [previewUrl, snippetPeaks, playSnippet]);

  const idle = deferStart && !gameState;

  if (!idle && isLoading) return <GameScreenLoading />;
  if (error) return <GameScreenError error={error} />;
  if (!idle && !gameState) return null;

  const startFromTap = () => {
    if (isStarting) return;
    playWhenReady.current = true;
    start();
  };

  const round: RoundData = gameState
    ? { ...gameState, answerImageUrl: gameState.answer?.albumImageUrl }
    : IDLE_ROUND;

  return (
    <GameRoundView
      round={round}
      isOver={!!isGameOver && !idle}
      shouldShake={shouldShake}
      idle={idle}
      audio={idle ? { ...gameAudio, playSnippet: startFromTap } : gameAudio}
      guess={{
        search: spotifySearch,
        onSubmit: handleSubmit,
        onSkip: idle ? startFromTap : handleSkip,
        submitPending,
        gameMode: GameMode.All,
      }}
      header={
        <GameHeader
          mode={GameMode.All}
          volume={volume}
          onVolumeChange={setVolume}
          // The name, not a Back link: this screen is the way in for a new
          // visitor, and the logo is the way home for everyone else.
          leading={
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="rounded-lg bg-spotify-green p-1.5">
                <Zap className="h-4 w-4 fill-black text-black" />
              </span>
              <span className="text-sm font-black uppercase italic tracking-tighter sm:text-base">
                Sopranino
              </span>
            </Link>
          }
          trailing={
            headerTrailing ??
            // Nothing at all while the site is gated: /api/auth/login is
            // blocked without the access cookie, so offering it is a dead end.
            (canSignIn && !user?.hasAccount && (
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
            ))
          }
        />
      }
      title={
        <>
          <div className="mb-3 flex flex-col items-center gap-2 sm:mb-4">
            <h1 className="sr-only">{heading}</h1>
            <ShuffleModeNav
              trackGroupId={trackGroupId}
              onTrackGroupChange={handleTrackGroupChange}
            />
            {(idle || !isGameOver) && (
              <p className="text-sm font-medium text-fg/50">
                Round {Math.min(round.currentRound + 1, round.maxRounds)} of{' '}
                {round.maxRounds}
              </p>
            )}
            {trackGroupWaits && (
              <p className="text-[11px] text-fg/40">
                New set from the next song
              </p>
            )}
          </div>
          <FameTierPicker
            value={fameTier}
            onChange={handleFameTierChange}
            playing={isGameOver || idle ? undefined : gameState?.fameTier}
            disabled={isStarting}
          />
        </>
      }
      reveal={
        gameState && (
          <>
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
            {afterReveal}
          </>
        )
      }
    />
  );
}
