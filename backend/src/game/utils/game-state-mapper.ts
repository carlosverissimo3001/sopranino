import { GameStatus } from '@prisma/client';
import { MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { GameStateDto } from '../dto/game-state.dto';
import { GameSessionEntity } from '../entities/game-session.entity';
import { normalizeText } from '../../utils/text';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { buildHintsForRound, HintSet } from './hint-builder';
import { TrackEntity } from '../../track/entities/track.entity';
import { catalogueTrackUrl } from '../../utils/utils';

export function mapToGameStateDto(
  game: GameSessionEntity,
  track: TrackEntity,
  set?: HintSet,
): GameStateDto {
  const guesses = game.guesses as unknown as GuessHistoryDto[];

  return {
    sessionId: game.id,
    currentRound: game.currentRound,
    snippetDuration:
      ROUND_DURATIONS[Math.min(game.currentRound, MAX_ROUNDS - 1)],
    maxRounds: MAX_ROUNDS,
    snippetSteps: [...ROUND_DURATIONS],
    status: game.status,
    fameTier: game.fameTier,
    guesses,
    // Safe to do, we throw on the caller if the track is not found or has no preview URL
    previewUrl: track.previewUrl!,
    albumImageUrl: track.albumImageUrl || undefined,
    answer:
      game.status !== GameStatus.PLAYING
        ? {
            id: track.id,
            name: track.name,
            normalizedName: normalizeText(track.name),
            artist: track.artistName,
            normalizedArtist: normalizeText(track.artistName),
            allArtists: track.allArtists,
            trackUrl: catalogueTrackUrl(track.id),
            albumImageUrl: track.albumImageUrl || undefined,
            albumName: track.albumName || undefined,
            albumUrl: track.albumUrl || undefined,
            releaseYear: track.releaseYear || undefined,
          }
        : undefined,
    hints:
      game.status === GameStatus.PLAYING
        ? buildHintsForRound(track, game.currentRound, set)
        : undefined,
  };
}
