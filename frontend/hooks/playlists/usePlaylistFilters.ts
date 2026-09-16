'use client';

import { useState } from 'react';
import { PlaylistItemKind, PlaylistSortBy } from '@/sdk';

export type KindFilter = 'ALL' | PlaylistItemKind;

export function usePlaylistFilters() {
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [sortBy, setSortBy] = useState<PlaylistSortBy>(PlaylistSortBy.Default);

  return { kind, setKind, sortBy, setSortBy };
}
