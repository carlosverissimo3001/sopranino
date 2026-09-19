'use client';

import { useState } from 'react';
import { PlaylistItemKind, PlaylistSortBy, SortOrder } from '@/sdk';

export type KindFilter = 'ALL' | PlaylistItemKind;

/** How each order reads when nothing says otherwise: A first, biggest first. */
export const NATURAL_ORDER: Record<PlaylistSortBy, SortOrder> = {
  [PlaylistSortBy.Default]: SortOrder.Asc,
  [PlaylistSortBy.Name]: SortOrder.Asc,
  [PlaylistSortBy.Tracks]: SortOrder.Desc,
};

export const flip = (order: SortOrder) =>
  order === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;

export function usePlaylistFilters() {
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [sortBy, setSortBy] = useState<PlaylistSortBy>(PlaylistSortBy.Default);
  const [order, setOrder] = useState<SortOrder>(SortOrder.Asc);

  /** The same order again turns around; another starts its own way. */
  const chooseSort = (next: PlaylistSortBy) => {
    setOrder(next === sortBy ? flip(order) : NATURAL_ORDER[next]);
    setSortBy(next);
  };

  return { kind, setKind, sortBy, order, chooseSort };
}
