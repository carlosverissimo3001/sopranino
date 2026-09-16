import { PlaylistSource } from '@prisma/client';
import type { SetMemberDto } from '../../track-group/dto/set-member.dto';

export interface PlaylistInfo {
  title: string;
  imageUrl?: string;
  checksum?: string;
  trackCount: number;
}

/** Deleted, or made private: either way there is nothing to read. */
export class PlaylistUnavailableError extends Error {}

export interface PlaylistProvider {
  readonly source: PlaylistSource;
  resolveId(link: string): Promise<string | null>;
  /** Throws PlaylistUnavailableError when the playlist cannot be read. */
  info(externalId: string): Promise<PlaylistInfo>;
  members(externalId: string, max: number): Promise<SetMemberDto[]>;
}

export const PLAYLIST_PROVIDERS = Symbol('PLAYLIST_PROVIDERS');
