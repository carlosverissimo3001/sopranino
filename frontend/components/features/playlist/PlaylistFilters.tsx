'use client';

import { memo, useId } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ArrowDownAZ,
  ArrowUpAZ,
  ListOrdered,
  Undo2,
} from 'lucide-react';
import {
  NATURAL_ORDER,
  type KindFilter,
} from '@/hooks/playlists/usePlaylistFilters';
import { PlaylistSortBy as SortPlaylistsBy, SortOrder } from '@/sdk';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface PlaylistFiltersProps {
  /** Shown only when the list holds more than one kind. */
  kinds?: {
    value: KindFilter;
    label: string;
    /** The selected pill's colours, when it should match what it filters. */
    accent?: { bg: string; text: string };
  }[];
  kind?: KindFilter;
  onKindChange?: (value: KindFilter) => void;
  sortBy: SortPlaylistsBy;
  /** Which way the chosen order runs; picking it again turns it around. */
  order: SortOrder;
  onSortByChange: (value: SortPlaylistsBy) => void;
}

/** One row per order; each says which way it runs once it is the chosen one. */
const SORT_OPTIONS = [
  { value: SortPlaylistsBy.Default, label: 'Default', icon: Undo2 },
  {
    value: SortPlaylistsBy.Name,
    icon: ArrowDownAZ,
    flippedIcon: ArrowUpAZ,
    labels: { asc: 'Name A-Z', desc: 'Name Z-A' },
  },
  {
    value: SortPlaylistsBy.Tracks,
    icon: ListOrdered,
    labels: { desc: 'Most tracks', asc: 'Least tracks' },
  },
] as const;

type SortRow = (typeof SORT_OPTIONS)[number];

/** What a row reads and looks like, given the order in force for it. */
function rowState(option: SortRow, order: SortOrder) {
  if (!('labels' in option)) {
    return { label: option.label, Icon: option.icon };
  }
  const flipped = order === SortOrder.Desc;
  return {
    label: option.labels[order],
    Icon: flipped && 'flippedIcon' in option ? option.flippedIcon : option.icon,
  };
}

const PILL_BASE =
  'relative overflow-hidden min-w-[72px] sm:min-w-[88px] h-8 sm:h-9 px-4 sm:px-5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-500 active:scale-90 flex items-center justify-center';
const PILL_ACTIVE =
  'bg-spotify-green border-fg/20 text-black shadow-[0_10px_20px_-10px_rgba(30,215,96,0.5)]';
const PILL_INACTIVE =
  'bg-fg/[0.03] border-fg/10 text-fg/40 hover:bg-fg/[0.08] hover:border-fg/20';

function PlaylistFiltersComponent({
  kinds,
  kind,
  onKindChange,
  sortBy,
  order,
  onSortByChange,
}: PlaylistFiltersProps) {
  const indicatorId = useId();
  const active = SORT_OPTIONS.find((option) => option.value === sortBy);
  const activeSort = rowState(active ?? SORT_OPTIONS[0], order);
  const isSortActive = sortBy !== SortPlaylistsBy.Default;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
      {kinds && (
        <div
          role="radiogroup"
          aria-label="Which playlists"
          className="flex h-8 items-center gap-0.5 rounded-full border border-fg/10 bg-fg/[0.03] p-0.5 sm:h-9"
        >
          {kinds.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={kind === option.value}
              onClick={() => onKindChange?.(option.value)}
              className={`relative h-full rounded-full px-3 text-[10px] font-black uppercase tracking-wider transition-colors sm:px-4 sm:text-xs ${
                kind === option.value
                  ? (option.accent?.text ?? 'text-black')
                  : 'text-fg/40 hover:text-fg/70'
              }`}
            >
              {kind === option.value && (
                <motion.span
                  layoutId={indicatorId}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                  className={`absolute inset-0 rounded-full transition-colors ${option.accent?.bg ?? 'bg-spotify-green'}`}
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          ))}
        </div>
      )}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className={`${PILL_BASE} ml-0.5 sm:ml-1 gap-1.5 outline-none ${isSortActive ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            {isSortActive && (
              <span className="absolute inset-1 rounded-full bg-spotify-green blur-md opacity-40 animate-pulse -z-10" />
            )}
            {isSortActive && (
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {isSortActive ? activeSort.label : 'Sort'}
              <ChevronDown className="size-3 opacity-60" />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-[160px] bg-surface/80 backdrop-blur-md border border-fg/10"
        >
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-fg/30 font-bold">
            Sort by
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-fg/5" />
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortByChange(v as SortPlaylistsBy)}
          >
            {SORT_OPTIONS.map((option) => {
              // A row that is not the chosen one shows the way it would start.
              const chosen = option.value === sortBy;
              const { label, Icon } = rowState(
                option,
                chosen ? order : NATURAL_ORDER[option.value],
              );
              return (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="text-xs text-fg/70 focus:bg-fg/[0.08] focus:text-fg data-[state=checked]:text-fg cursor-pointer gap-2"
                >
                  <Icon className="size-3.5 opacity-50" />
                  {label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const PlaylistFilters = memo(PlaylistFiltersComponent);
