/** Game constants */
export enum GuessResult {
  Correct = 'CORRECT',
  Artist = 'ARTIST',
  Album = 'ALBUM',
  Wrong = 'WRONG',
  Skip = 'SKIP',
  ArtistAndAlbum = 'ARTIST_AND_ALBUM',
}

export const ROUND_DURATIONS = [0.1, 1, 2, 4, 7, 12];
export const MAX_ROUNDS = ROUND_DURATIONS.length;
