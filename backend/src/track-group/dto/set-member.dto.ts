export interface NewSetTrackDto {
  isrc: string;
  name: string;
  artistName: string;
  albumName: string;
  albumUrl: string;
  albumImageUrl?: string;
  /** Deezer's rank, which is what fame means everywhere else in the pool. */
  fame: number;
  year: number;
}

export interface SetMemberDto {
  /**
   * The pool row this entry plays as. For a song the pool already holds that
   * is its existing id, often a different upload from the one linked: the pool
   * canonicalises to the most-streamed recording.
   */
  trackId: string;
  /** Absent when the song is already in the pool. */
  create?: NewSetTrackDto;
}
