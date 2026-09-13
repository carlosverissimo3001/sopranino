import { Injectable } from '@nestjs/common';
import {
  PreviewLookupService,
  parseRef,
  serializeRef,
} from './preview-lookup.service';
import { TrackDto } from '../dto/track.dto';
import { TrackRepository } from '../repositories/track.repository';
import { TrackEntity } from '../entities/track.entity';
import { UpsertTrackDto } from '../dto/upsert-track.dto';
import { LastfmService } from './lastfm.service';
import { hasFreshLastfm } from '../utils/lastfm-freshness';
import { AppLoggerService } from '../../logger/logger.service';

@Injectable()
export class TrackService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly trackRepository: TrackRepository,
    private readonly previewLookup: PreviewLookupService,
    private readonly lastfmService: LastfmService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(TrackService.name);
  }

  /**
   * Fetches a track's Last.fm metadata, which the fame and genre hints read,
   * without holding up the caller: the hints are not needed until a guess has
   * been spent. A failure is logged and the next play simply tries again.
   */
  enrichInBackground(track: TrackEntity): void {
    const meta = track.metadata ?? {};
    if (hasFreshLastfm(meta)) {
      return;
    }

    void this.lastfmService
      .getTrackInfo(track.name, track.artistName)
      .then((lastfm) =>
        lastfm
          ? this.trackRepository.updateMetadata(track.id, { ...meta, lastfm })
          : undefined,
      )
      .catch((err: Error) =>
        this.logger.warn(`Enrichment failed for ${track.id}: ${err.message}`),
      );
  }

  async findById(id: string): Promise<TrackEntity | null> {
    return this.trackRepository.findById(id);
  }

  async findMany(ids: string[]): Promise<TrackEntity[]> {
    return this.trackRepository.findMany(ids);
  }

  async upsertTrack(id: string, data: UpsertTrackDto): Promise<TrackEntity> {
    return this.trackRepository.upsertTrack(id, data);
  }

  /**
   * Resolves audio for a track we already hold a row for — a pool track, which
   * is seeded without one because Deezer's preview links expire in minutes.
   *
   * The ref is persisted on first use, so later rounds only re-mint rather than
   * running the whole cascade again.
   */
  async resolvePreview(track: TrackEntity): Promise<string | null> {
    const existing = await this.playableUrl(track);
    if (existing) {
      return existing;
    }

    const ref = await this.previewLookup.getPreviewRef(track.id, {
      title: track.name,
      artist: track.artistName,
      isrc: track.isrc,
    });
    if (!ref) {
      return null;
    }

    const url = await this.previewLookup.mint(ref);
    await this.trackRepository.upsertTrack(track.id, {
      name: track.name,
      artistName: track.artistName,
      albumImageUrl: track.albumImageUrl,
      albumName: track.albumName,
      albumUrl: track.albumUrl,
      releaseYear: track.releaseYear,
      isrc: track.isrc,
      previewUrl: url ?? undefined,
      previewRef: serializeRef(ref),
      allArtists: track.allArtists,
    });
    return url;
  }

  /**
   * Get a track with its preview URL
   * @param spotifyTrackId - The Spotify track ID
   * @param trackData - The track data
   * @returns The track with its preview URL
   */
  async getTrackWithPreview(
    spotifyTrackId: string,
    trackData: TrackDto,
  ): Promise<TrackEntity> {
    const existingTrack = await this.trackRepository.findById(spotifyTrackId);
    if (existingTrack?.previewRef) {
      const url = await this.playableUrl(existingTrack);
      if (url) {
        return { ...existingTrack, previewUrl: url };
      }
    }

    const ref = await this.previewLookup.getPreviewRef(spotifyTrackId, {
      title: trackData.name,
      artist: trackData.primaryArtist,
      isrc: trackData.isrc,
    });
    const resolvedUrl = ref ? await this.previewLookup.mint(ref) : null;

    return await this.trackRepository.upsertTrack(spotifyTrackId, {
      name: trackData.name,
      artistName: trackData.primaryArtist,
      albumImageUrl: trackData.imageUrl,
      albumName: trackData.albumName,
      albumUrl: trackData.albumId
        ? `https://open.spotify.com/album/${trackData.albumId}`
        : undefined,
      releaseYear: trackData.releaseYear,
      isrc: trackData.isrc,
      previewUrl: resolvedUrl ?? undefined,
      previewRef: ref ? serializeRef(ref) : undefined,
      allArtists: trackData.allArtists,
    });
  }

  /**
   * The stored URL may have expired, so anything with a ref is re-minted.
   */
  async playableUrl(track: TrackEntity): Promise<string | null> {
    if (track.previewRef) {
      const ref = parseRef(track.previewRef);
      if (ref) {
        return (await this.previewLookup.mint(ref)) ?? track.previewUrl ?? null;
      }
    }

    return track.previewUrl ?? null;
  }
}
