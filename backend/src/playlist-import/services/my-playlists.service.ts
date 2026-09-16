import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { LIKED_SONGS_ID_SUFFIX } from '../../consts';
import { AppLoggerService } from '../../logger/logger.service';
import { PLAYLIST_SORT_BY } from '../../playlist/consts';
import type { PlaylistDto } from '../../playlist/dto/playlist.dto';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { MyPlaylistsDto } from '../dto/my-playlists.dto';
import {
  compareFor,
  fromImport,
  fromSpotify,
} from '../utils/my-playlists.utils';
import { PlaylistImportService } from './playlist-import.service';

/** Spotify's largest page; only the first is read, as the old listing did. */
const SPOTIFY_PAGE = 50;

@Injectable()
export class MyPlaylistsService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly authService: AuthService,
    private readonly playlistService: PlaylistService,
    private readonly playlistImportService: PlaylistImportService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(MyPlaylistsService.name);
  }

  async list(
    sessionId: string,
    sortBy: PLAYLIST_SORT_BY = PLAYLIST_SORT_BY.DEFAULT,
  ): Promise<MyPlaylistsDto> {
    const user = await this.authService.getUserBySessionId(sessionId);

    const [spotify, imports] = await Promise.all([
      user.spotifyUserId
        ? this.readSpotify(sessionId)
        : Promise.resolve({ items: [], unavailable: false }),
      this.playlistImportService.list(sessionId),
    ]);

    const liked = spotify.items.filter((p) =>
      p.id.endsWith(LIKED_SONGS_ID_SUFFIX),
    );
    const rest = [
      ...imports.map(fromImport),
      ...spotify.items
        .filter((p) => !p.id.endsWith(LIKED_SONGS_ID_SUFFIX))
        .map(fromSpotify),
    ];
    const compare = compareFor(sortBy);

    return {
      items: [
        ...liked.map(fromSpotify),
        ...(compare ? rest.sort(compare) : rest),
      ],
      spotifyUnavailable: spotify.unavailable,
    };
  }

  private async readSpotify(
    sessionId: string,
  ): Promise<{ items: PlaylistDto[]; unavailable: boolean }> {
    try {
      const page = await this.playlistService.getMyPlaylists({
        sessionId,
        limit: SPOTIFY_PAGE,
        offset: 0,
      });
      return { items: page.items, unavailable: false };
    } catch (err) {
      this.logger.warn(
        `Spotify playlists unavailable: ${(err as Error).message}`,
      );
      return { items: [], unavailable: true };
    }
  }
}
