import {
  GameMode,
  GameStatus,
  /* MultiplayerRoom, */
  Prisma,
  Track,
  /* User, */
} from '@prisma/client';
import { Track as SpotifyTrack } from '@spotify/web-api-ts-sdk';
import { isNil } from 'lodash';
import { GuessAudioDto } from '../game/dto/guess/guess-audio.dto';
import { GuessResult } from '../game/consts';
import { GuessHistoryDto } from '../game/dto/guess/guess-history.dto';
import { GameSessionEntity } from '../game/entities/game-session.entity';
import { TrackDto } from '../track/dto/track.dto';
import { TrackEntity } from '../track/entities/track.entity';
import { TrackMetadataVo } from '../track/vo/track-metadata.vo';
import { normalizeText } from './text';
import { computeScore, getFirstImage, getTrackReleaseYear } from './utils';

type PrismaGuessItem = {
  result: string;
  trackId?: string;
  trackName?: string;
  artistName?: string;
  audio?: GuessAudioDto;
};

// Type to include all nested prisma relations of TModel, recursively
type AllIncludes<TModel> = {
  [K in keyof Required<TModel>]: Exclude<
    TModel[K],
    boolean | undefined
  > extends {
    include?: infer TInclude;
  }
    ? {
        include: AllIncludes<NonNullable<TInclude>>;
      }
    : true;
};

export type PrismaGameSessionResult = Prisma.GameSessionGetPayload<{
  include: AllIncludes<Prisma.GameSessionInclude>;
}>;

function toUndefinedIfNull<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Runs map() over the value of key if it exists in data, otherwise returns an empty object
function incMap<
  T extends Record<string, unknown>,
  TKey extends keyof T,
  TResult,
>(
  data: T,
  key: TKey,
  map: (value: NonNullable<T[TKey]>) => TResult,
): Record<TKey, TResult> | Record<never, never> {
  const isDefined = !isNil(data[key]);
  return isDefined ? { [key]: map(data[key] as NonNullable<T[TKey]>) } : {};
}

function mapGuesses(
  prismaGuesses: Prisma.InputJsonValue | null,
): GuessHistoryDto[] {
  if (prismaGuesses == null || !Array.isArray(prismaGuesses)) {
    return [];
  }
  return prismaGuesses.map((g: PrismaGuessItem) => ({
    result: g.result as GuessResult,
    trackId: g.trackId,
    trackName: g.trackName ?? 'Unknown',
    artistName: g.artistName ?? 'Unknown',
    // A guess writes the whole history back, so a field dropped here is
    // erased from every earlier round.
    ...(g.audio && { audio: g.audio }),
  }));
}

// TODO: Try to unify TrackDto and TrackEntity
export function mapSpotifyTrackToTrackEntity(track: SpotifyTrack): TrackDto {
  return {
    id: track.id,
    name: track.name,
    normalizedName: normalizeText(track.name),
    artists: track.artists.map((a) => a.name),
    allArtists: track.artists.map((a) => a.name),
    primaryArtist: track.artists[0]?.name || 'Unknown Artist',
    albumName: track.album.name,
    albumId: track.album.id,
    imageUrl: getFirstImage(track.album.images),
    durationMs: track.duration_ms,
    externalUrl: track.external_urls.spotify,
    isrc: track.external_ids?.isrc || undefined,
    isPlayable: track.is_playable ?? false,
    releaseYear: getTrackReleaseYear(
      track.album.release_date,
      track.album.release_date_precision,
    ),
  };
}

export function mapTrack(record: Track): TrackEntity {
  const modelMetadata = record.metadata
    ? (record.metadata as Prisma.JsonObject)
    : undefined;
  const metadata = modelMetadata
    ? new TrackMetadataVo(modelMetadata)
    : undefined;
  return new TrackEntity({
    ...record,
    albumImageUrl: toUndefinedIfNull(record.albumImageUrl),
    albumName: toUndefinedIfNull(record.albumName),
    albumUrl: toUndefinedIfNull(record.albumUrl),
    releaseYear: toUndefinedIfNull(record.releaseYear),
    isrc: toUndefinedIfNull(record.isrc),
    previewUrl: toUndefinedIfNull(record.previewUrl),
    previewRef: toUndefinedIfNull(record.previewRef),
    metadata,
  });
}

/* export function mapRoom(record: MultiplayerRoom): MultiplayerRoomEntity {
  return {
    id: record.id,
    playlistId: record.playlistId,
    mode: record.mode,
    trackId: record.trackId,
    currentRound: record.currentRound,
    status: record.status,
    createdAt: record.createdAt,
  };
}
*/

/* export function mapUser(user: User): User {
  return {
    avatarUrl: user.name,
    isTrusted: user.isTrusted,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
*/

type CommonFields = {
  id: string;
  playlistId: string;
  mode: GameMode;
  trackId: string;
  currentRound: number;
  status: GameStatus;
  createdAt: Date;
};

function includeCommon(data: CommonFields) {
  return {
    id: data.id,
    playlistId: data.playlistId,
    mode: data.mode,
    trackId: data.trackId,
    currentRound: data.currentRound,
    status: data.status,
    createdAt: data.createdAt,
  };
}

export function mapGameSession(
  data: PrismaGameSessionResult,
): GameSessionEntity {
  return {
    ...includeCommon(data),
    userId: data.userId,
    completedAt: toUndefinedIfNull(data.completedAt),
    score: computeScore(data.status, data.currentRound),
    guesses: mapGuesses(data.guesses),
    ...incMap(data, 'track', mapTrack),
  };
}
