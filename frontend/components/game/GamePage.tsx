'use client';

import { useGameOrchestrator } from '@/hooks/game/useGameOrchestrator';
import { useVolume } from '@/hooks/game/useVolume';
import { useWarnOnLeave } from '@/hooks/useWarnOnLeave';
import { SongRevealCard } from './SongRevealCard';
import { GameHeader } from './GameHeader';
import { GameTitle } from './GameTitle';
import { GameRoundView } from './GameRoundView';
import { GameScreenError, GameScreenLoading } from './GameScreenStatus';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

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

  useWarnOnLeave(!!gameState && !isGameOver);

  if (isLoading) return <GameScreenLoading />;
  if (error) return <GameScreenError error={error} />;
  if (!gameState) return null;

  const playlistReveal = isPlaylist && playlist ? playlist : null;

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
        gameMode: mode,
      }}
      header={
        <GameHeader
          mode={mode}
          playlist={playlist ?? null}
          stats={stats ?? null}
          volume={volume}
          onVolumeChange={setVolume}
        />
      }
      title={
        !isGameOver && (
          <GameTitle
            mode={mode}
            currentRound={gameState.currentRound}
            maxRounds={gameState.maxRounds}
            heading={heading}
          />
        )
      }
      reveal={
        <SongRevealCard
          status={gameState.status}
          answer={gameState.answer}
          previewUrl={gameState.previewUrl}
          shareGameId={isDaily ? gameState.sessionId : null}
          showViewStats={isDaily}
          showPlayAgain={isPlaylist}
          onPlayAgain={isPlaylist ? handlePlayAgain : undefined}
          playlistExternalUrl={playlistReveal?.externalUrl ?? null}
          playlistName={playlistReveal?.name ?? null}
          playlistTotalTracks={playlistReveal?.totalTracks ?? null}
          playlistImageUrl={playlistReveal?.imageUrl ?? null}
          isFullSongPlaying={gameAudio.isFullSongPlaying}
          onToggleFullSong={gameAudio.toggleFullSong}
          rankTitle={gameState.rankTitle ?? null}
        />
      }
    />
  );
}
