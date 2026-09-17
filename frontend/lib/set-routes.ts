const SPOTIFY_PREFIX = 'spotify-';

/** A Spotify playlist's page, under the one route every set uses. */
export const spotifySetPath = (playlistId: string) =>
  `/group/${SPOTIFY_PREFIX}${playlistId}`;

/** The playlist id inside such a slug, or null for a track group's own slug. */
export function spotifyPlaylistIdFrom(slug: string): string | null {
  return slug.startsWith(SPOTIFY_PREFIX)
    ? slug.slice(SPOTIFY_PREFIX.length) || null
    : null;
}
