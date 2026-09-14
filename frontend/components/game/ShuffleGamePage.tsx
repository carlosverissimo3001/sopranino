'use client';

import Image from 'next/image';
import { usePoolGameOrchestrator } from '@/hooks/game/usePoolGameOrchestrator';
import { useMe } from '@/hooks/auth/useMe';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { Button } from '@/components/ui/button';
import { SongRevealCard } from './SongRevealCard';
import { ClaimNamePrompt } from './ClaimNamePrompt';
import { GameHeader } from './GameHeader';
import { GameTitle } from './GameTitle';
import { GameRoundView } from './GameRoundView';
import { GameScreenError, GameScreenLoading } from './GameScreenStatus';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

/**
 * A round drawn from the curated pool rather than a playlist. Open to anyone:
 * for a signed-out visitor, starting one is also what mints their account.
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

  useWarnOnLeave(!!gameState && !isGameOver);

  if (isLoading) return <GameScreenLoading />;
  if (error) return <GameScreenError error={error} />;
  if (!gameState) return null;

  return (
    <GameRoundView
      round={{
        ...gameState,
        answerImageUrl: gameState.answer?.albumImageUrl,
      }}
      isOver={!!isGameOver}
      shouldShake={shouldShake}
      audio={gameAudio}
      guess={{
        search: spotifySearch,
        onSubmit: handleSubmit,
        onSkip: handleSkip,
        submitPending,
        gameMode: GameMode.All,
      }}
      header={
        <GameHeader
          mode={GameMode.All}
          volume={volume}
          onVolumeChange={setVolume}
          trailing={
            // Nothing at all while the site is gated: /api/auth/login is
            // blocked without the access cookie, so offering it is a dead end.
            canSignIn &&
            !user?.hasAccount && (
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
            )
          }
        />
      }
      title={
        !isGameOver && (
          <GameTitle
            mode={GameMode.All}
            currentRound={gameState.currentRound}
            maxRounds={gameState.maxRounds}
          />
        )
      }
      reveal={
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
        </>
      }
    />
  );
}
