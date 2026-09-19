import { PlaylistSource } from '@prisma/client';
import { PLAYLIST_SORT_BY, SORT_ORDER } from '../../playlist/consts';
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
  origin: set.origin,
  pending: set.pending,
  staleSince: set.staleSince,
  refreshedAt: set.refreshedAt,
  refreshing: set.refreshing,
});

type Comparator = (a: PlaylistItemDto, b: PlaylistItemDto) => number;

const byName: Comparator = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

const bySize: Comparator = (a, b) => a.trackCount - b.trackCount;

/** Which way round each is read when nothing says: A first, biggest first. */
const NATURAL: Record<string, SORT_ORDER> = {
  [PLAYLIST_SORT_BY.NAME]: SORT_ORDER.ASC,
  [PLAYLIST_SORT_BY.TRACKS]: SORT_ORDER.DESC,
};

/** Absent for the default order, which keeps each source's own. */
export const compareFor = (
  sortBy: PLAYLIST_SORT_BY,
  order?: SORT_ORDER,
): Comparator | undefined => {
  const compare =
    sortBy === PLAYLIST_SORT_BY.NAME
      ? byName
      : sortBy === PLAYLIST_SORT_BY.TRACKS
        ? bySize
        : undefined;
  if (!compare) {
    return undefined;
  }

  const wanted = order ?? NATURAL[sortBy];
  return wanted === SORT_ORDER.DESC ? (a, b) => compare(b, a) : compare;
};
