import { GuessHistoryDtoResultEnum as GuessResult } from '@/sdk';

export interface Guessed {
  trackName?: string | null;
  artistName?: string | null;
  albumName?: string | null;
  result: GuessResult | null;
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
