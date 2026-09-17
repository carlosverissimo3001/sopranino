import { Playlist, SimplifiedPlaylist, Track } from '@spotify/web-api-ts-sdk';
import { UserSessionDto } from '../../auth/dto/user-session.dto';
import { PlaylistDto } from '../dto/playlist.dto';
import { getFirstImage } from '../../utils/utils';

/**
 * Type for Spotify API response that may use either old (tracks) or new (items) field names.
 * Spotify renamed tracks -> items in February 2026, but SDK types haven't been updated yet.
 */
type PlaylistWithItems = (Playlist<Track> | SimplifiedPlaylist) & {
  items?: { total?: number };
};

/**
 * Lite Version: For browsing lists of playlists
 */
export function mapPlaylistLite(
  playlist: Playlist<Track> | SimplifiedPlaylist,
): PlaylistDto {
  // Handle both new API (items) and old SDK types (tracks) for Feb 2026 API change
  const playlistWithItems = playlist as PlaylistWithItems;
  const totalTracks =
    playlistWithItems.items?.total ?? playlist.tracks?.total ?? 0;

  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description || '',
    imageUrl: getFirstImage(playlist.images),
    owner: playlist.owner?.display_name || 'Unknown',
    totalTracks,
    isPublic: playlist.public ?? true,
    externalUrl: playlist.external_urls?.spotify || '',
  };
}

/** The playlists a round can be played from. */
export function playablePlaylists(
  playlists: SimplifiedPlaylist[],
  session: UserSessionDto,
): SimplifiedPlaylist[] {
  return playlists.filter((p) => {
    // Handle both new API (items) and old SDK types (tracks) for Feb 2026 API change
    const playlist = p as PlaylistWithItems;

    /**Note: Spotify playlist images are guaranteed to exist (i.e, even if the user has not set a custom one,
    / Spotify generates one based on the playlist's tracks). If a playlist does not have one, then it's likely that
    / it is either empty, or includes only local files, which are obvisouly songs we cannot play
    / This is not 100% guaranteed, but I'm betting on it
    */
    const hasImage = playlist.images?.some((img) => !!img.url);
    const hasTracks = (playlist.items?.total ?? 0) > 0;
    // Spotify only allows playing user-owned playlists. The presence check is
    // load-bearing: without it an unlinked session matches every playlist.
    const isOwnedByUser =
      !!session.spotifyUserId && playlist.owner?.id === session.spotifyUserId;

    return hasImage && hasTracks && isOwnedByUser;
  });
}
