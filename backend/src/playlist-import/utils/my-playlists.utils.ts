import { PlaylistSource } from '@prisma/client';
import { PLAYLIST_SORT_BY } from '../../playlist/consts';
import type { PlaylistDto } from '../../playlist/dto/playlist.dto';
import type { ImportedSetDto } from '../dto/imported-set.dto';
import { PlaylistItemDto, PlaylistItemKind } from '../dto/my-playlists.dto';

export const fromSpotify = (playlist: PlaylistDto): PlaylistItemDto => ({
  kind: PlaylistItemKind.SPOTIFY,
  id: playlist.id,
  name: playlist.name,
  imageUrl: playlist.imageUrl,
  trackCount: playlist.totalTracks,
  externalUrl: playlist.externalUrl,
  owner: playlist.owner,
  source: PlaylistSource.SPOTIFY,
});

export const fromImport = (set: ImportedSetDto): PlaylistItemDto => ({
  kind: PlaylistItemKind.IMPORTED,
  id: set.id,
  name: set.name,
  imageUrl: set.imageUrl,
  trackCount: set.trackCount,
  externalUrl: set.externalUrl,
  slug: set.slug,
  source: set.source,
  pending: set.pending,
  staleSince: set.staleSince,
});

/** Absent for the default order, which keeps each source's own. */
export const compareFor = (
  sortBy: PLAYLIST_SORT_BY,
): ((a: PlaylistItemDto, b: PlaylistItemDto) => number) | undefined => {
  switch (sortBy) {
    case PLAYLIST_SORT_BY.NAME:
      return (a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    case PLAYLIST_SORT_BY.TRACKS:
      return (a, b) => b.trackCount - a.trackCount;
    default:
      return undefined;
  }
};
