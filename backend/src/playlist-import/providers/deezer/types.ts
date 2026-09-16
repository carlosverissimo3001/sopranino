export interface DeezerPlaylistTrack {
  id?: number;
  title?: string;
  isrc?: string;
  rank?: number;
  readable?: boolean;
  preview?: string;
  artist?: { name?: string };
  album?: {
    id?: number;
    title?: string;
    cover_xl?: string;
    cover_big?: string;
  };
}

export interface DeezerPlaylist {
  id: number;
  title: string;
  checksum?: string;
  nb_tracks?: number;
  public?: boolean;
  picture_xl?: string;
  picture_big?: string;
}

export type DeezerResult<T> =
  | { ok: true; body: T }
  | { ok: false; code?: number };
