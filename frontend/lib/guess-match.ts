import { GuessHistoryDtoResultEnum as GuessResult } from '@/sdk';

export interface Guessed {
  trackName?: string | null;
  artistName?: string | null;
  albumName?: string | null;
  result: GuessResult | null;
}

/**
 * What the label is about: a near miss names the thing that matched, not the
 * song guessed, which is the one piece of information it carries.
 */
export function matchedName(guess: Guessed): string | undefined {
  const { trackName, artistName, albumName, result } = guess;
  switch (result) {
    case GuessResult.Artist:
      return artistName ?? trackName ?? undefined;
    // Guesses stored before the album was kept fall back to the song.
    case GuessResult.Album:
      return albumName ?? trackName ?? undefined;
    case GuessResult.ArtistAndAlbum:
      return (
        [artistName, albumName].filter(Boolean).join(', ') ||
        (trackName ?? undefined)
      );
    default:
      return trackName ?? undefined;
  }
}

/** What the guesses so far have proved about the answer, kept on screen. */
export function knownFromGuesses(guesses: Guessed[]): {
  artist?: string;
  album?: string;
} {
  const known: { artist?: string; album?: string } = {};
  for (const guess of guesses) {
    if (
      guess.result === GuessResult.Artist ||
      guess.result === GuessResult.ArtistAndAlbum
    ) {
      known.artist = guess.artistName ?? known.artist;
    }
    if (
      guess.result === GuessResult.Album ||
      guess.result === GuessResult.ArtistAndAlbum
    ) {
      known.album = guess.albumName ?? known.album;
    }
  }
  return known;
}
