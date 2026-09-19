'use client';

import { useRouter } from 'next/navigation';
import { useDailyGameOrchestrator } from '@/hooks/game/useDailyGameOrchestrator';
import { useMe } from '@/hooks/auth/useMe';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { spotifySetPath } from '@/lib/set-routes';
import { SongRevealCard } from './SongRevealCard';
import { RevealGuestPrompt } from './RevealGuestPrompt';
import { GameHeader } from './GameHeader';
import { GameLogo } from './GameLogo';
import { ShuffleModeNav } from './ShuffleModeNav';
import { GameRoundView } from './GameRoundView';
import { GameScreenError, GameScreenLoading } from './GameScreenStatus';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

/**
 * The daily on the same screen as every other round. What is its own stays:
 * one song for everybody, so no picker and no tiers, the streak, and the share
 * card. Picking something else leaves for its page rather than replacing the
 * round, so the daily cannot be restarted from here.
 */
export function DailyGamePage() {
  const router = useRouter();
  const { volume, setVolume } = useVolume();
  const { data: user } = useMe();

  const {
    gameState,
    stats,
    isLoading,
    error,
    isGameOver,
    submitPending,
    shouldShake,
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
  } = useDailyGameOrchestrator({ volume });

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
        gameMode: GameMode.Daily,
      }}
      header={
        <GameHeader
          mode={GameMode.Daily}
          stats={stats ?? null}
          volume={volume}
          onVolumeChange={setVolume}
          leading={<GameLogo />}
        />
      }
      title={
        <div className="relative mb-5 flex flex-col items-center gap-3 sm:mb-8 sm:gap-4">
          <h1 className="sr-only">Daily song: guess today&apos;s song</h1>
          <ShuffleModeNav
            current="/daily"
            onTrackGroupChange={(_groupId, _hasTiers, slug) =>
              router.push(slug ? `/group/${slug}` : '/shuffle')
            }
            onPlaylistChange={(playlist) =>
              router.push(spotifySetPath(playlist.id))
            }
          />
          {!isGameOver && (
            <p className="text-xs font-medium text-fg/50">
              Round {Math.min(gameState.currentRound + 1, gameState.maxRounds)}{' '}
              of {gameState.maxRounds}
            </p>
          )}
        </div>
      }
      reveal={
        <SongRevealCard
          status={gameState.status}
          answer={gameState.answer}
          previewUrl={gameState.previewUrl}
          shareGameId={gameState.sessionId}
          showViewStats
          isFullSongPlaying={gameAudio.isFullSongPlaying}
          onToggleFullSong={gameAudio.toggleFullSong}
          rankTitle={gameState.rankTitle ?? null}
          tries={gameState.guesses.length}
          footer={user && !user.hasAccount && <RevealGuestPrompt />}
        />
      }
    />
  );
}
