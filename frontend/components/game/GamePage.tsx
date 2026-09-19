'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { usePoolGameOrchestrator } from '@/hooks/game/usePoolGameOrchestrator';
import { useMe } from '@/hooks/auth/useMe';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { Button } from '@/components/ui/button';
import { SNIPPET_STEPS } from '@/lib/snippet-timeline';
import { SongRevealCard } from './SongRevealCard';
import { RevealGuestPrompt } from './RevealGuestPrompt';
import { GameHeader } from './GameHeader';
import { GameLogo } from './GameLogo';
import { ShuffleModeNav } from './ShuffleModeNav';
import { FAME_TIERS } from '@/lib/fame-tier';
import {
  useTrackGroupById,
  useTrackGroupName,
} from '@/hooks/track-groups/useTrackGroupName';
import { guessLine } from '@/lib/track-group-labels';
import { spotifySetPath } from '@/lib/set-routes';
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

interface GamePageProps {
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
  /** Keep the address on the set being played, so a reload or a share opens it. */
  syncUrl?: boolean;
  /** Under the reveal, once a round is over. */
  afterReveal?: ReactNode;
  /** A set's own page opens on that set. */
  initialTrackGroupId?: string;
  /** A Spotify playlist to play instead of the pool, from its own page. */
  initialPlaylistId?: string;
  /** Its name, since a playlist is not a set the nav can look up. */
  initialPlaylistName?: string;
  /** False when the opening set is a chart, whose songs are all hits. */
  initialTiersApply?: boolean;
}

/**
 * A round drawn from the curated pool rather than a playlist. Open to anyone:
 * for a signed-out visitor, starting one is also what mints their account.
 */
export function GamePage({
  canSignIn,
  deferStart = false,
  headerTrailing,
  heading = 'Shuffle: guess the song from a snippet',
  syncUrl = false,
  afterReveal,
  initialTrackGroupId,
  initialPlaylistId,
  initialPlaylistName,
  initialTiersApply = true,
}: GamePageProps) {
  const { volume, setVolume } = useVolume();
  // A chart is all hits, so a tier would promise a difference it cannot make.
  const [tiersApply, setTiersApply] = useState(initialTiersApply);
  // Names of the playlists picked this session, since the nav cannot look one
  // up the way it looks up a set.
  const [playlistNames, setPlaylistNames] = useState<Record<string, string>>(
    initialPlaylistId && initialPlaylistName
      ? { [initialPlaylistId]: initialPlaylistName }
      : {},
  );
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
    playlistId,
    handleTrackGroupChange,
    handlePlaylistChange,
    playingPlaylistId,
    trackGroupWaits,
    playingTrackGroupId,
  } = usePoolGameOrchestrator({
    volume,
    autoStart: !deferStart,
    initialTrackGroupId,
    initialPlaylistId,
  });

  useWarnOnLeave(!!gameState && !isGameOver);
  const queuedSetName = useTrackGroupName(trackGroupId);
  // What the next song will come from: a playlist names itself, a set is
  // looked up, and neither means the whole pool.
  const queuedName = playlistId
    ? playlistNames[playlistId]
    : (queuedSetName ?? 'All songs');
  const playingSet = useTrackGroupById(playingTrackGroupId);

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

  // A replace, not a navigation: the round carries on. It follows the song on
  // screen, so a pick waiting for the next one does not rewrite the address of
  // what is still playing.
  useEffect(() => {
    if (!syncUrl) return;
    const path = playingPlaylistId
      ? spotifySetPath(playingPlaylistId)
      : playingSet?.slug
        ? `/group/${playingSet.slug}`
        : '/shuffle';
    window.history.replaceState(null, '', path);
  }, [syncUrl, playingPlaylistId, playingSet?.slug]);

  if (!idle && isLoading) return <GameScreenLoading />;
  if (error) return <GameScreenError error={error} />;
  if (!idle && !gameState) return null;

  const startFromTap = () => {
    if (isStarting) return;
    playWhenReady.current = true;
    start();
  };

  // A round drawn from a playlist has no tier, so a set picked during one
  // brings the tier with it: name it, or the next song's difficulty is a
  // surprise.
  const tierWaits =
    tiersApply &&
    !idle &&
    !isGameOver &&
    (!gameState?.fameTier || gameState.fameTier !== fameTier);

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
          center={
            playingSet && (
              <p className="text-sm font-bold tracking-tight text-fg md:text-base">
                {guessLine(playingSet)}
              </p>
            )
          }
          leading={<GameLogo />}
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
          <div className="relative mb-5 flex flex-col items-center gap-3 sm:mb-8 sm:gap-4">
            <h1 className="sr-only">{heading}</h1>
            {/* In the header from sm up; here on a phone, which has no room there. */}
            {playingSet && (
              <p className="text-base font-bold tracking-tight text-fg sm:hidden">
                {guessLine(playingSet)}
              </p>
            )}
            <ShuffleModeNav
              trackGroupId={trackGroupId}
              playingTrackGroupId={playingTrackGroupId}
              playingLabel={
                playingPlaylistId ? playlistNames[playingPlaylistId] : undefined
              }
              selectedPlaylistId={playlistId}
              onPlaylistChange={(playlist) => {
                setTiersApply(false);
                setPlaylistNames((names) => ({
                  ...names,
                  [playlist.id]: playlist.name,
                }));
                handlePlaylistChange(playlist.id);
              }}
              onTrackGroupChange={(groupId, hasTiers) => {
                setTiersApply(hasTiers);
                handleTrackGroupChange(groupId);
              }}
            />
            {/* One line for where the round stands and how hard it is. */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              {(idle || !isGameOver) && (
                <p className="text-xs font-medium text-fg/50">
                  Round {Math.min(round.currentRound + 1, round.maxRounds)} of{' '}
                  {round.maxRounds}
                </p>
              )}
              {tiersApply && (
                <FameTierPicker
                  className=""
                  showWaitNote={false}
                  value={fameTier}
                  onChange={handleFameTierChange}
                  playing={isGameOver || idle ? undefined : gameState?.fameTier}
                  disabled={isStarting}
                />
              )}
            </div>
            {(trackGroupWaits || tierWaits) && (
              // In the gap below, taking no room: queuing a change moves nothing.
              <p className="absolute inset-x-0 top-full mt-0.5 text-center text-[11px] text-amber-300/80 sm:mt-2">
                From the next song:{' '}
                {[
                  trackGroupWaits && queuedName,
                  tierWaits &&
                    FAME_TIERS.find((t) => t.value === fameTier)?.label,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
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
              tries={gameState.guesses.length}
              // The prompt renders nothing for an account, and the card would
              // still draw its strip.
              footer={user && !user.hasAccount && <RevealGuestPrompt />}
            />
            {afterReveal}
          </>
        )
      }
    />
  );
}
