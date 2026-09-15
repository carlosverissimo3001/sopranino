'use client';

import { formatSeconds } from '@/lib/snippet-timeline';
import { useIsBelowSm } from '@/hooks/useIsBelowSm';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, X, Disc3 } from 'lucide-react';
import { List, type RowComponentProps } from 'react-window';
import { StartGameDtoModeEnum as GameMode, TrackOptionDto } from '@/sdk';
import { MIN_QUERY_LENGTH } from '@/consts/consts';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';

const ITEM_HEIGHT = 60;
const MAX_VISIBLE_ITEMS = 5;

export interface GuessSearchState {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  selectedTrack: TrackOptionDto | null;
  filteredTracks: TrackOptionDto[];
  isLoading: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  handleSelectTrack: (track: TrackOptionDto) => void;
  handleClearSelection: () => void;
}

interface GuessInputProps {
  search: GuessSearchState;
  gameMode?: (typeof GameMode)[keyof typeof GameMode];
  onSubmit: () => void;
  onSkip: () => void;
  submitPending: boolean;
  /** What skipping buys. Absent on the last round, where skipping gives up. */
  nextSnippetDuration?: number;
  /** The last round's four options, shown in place of search. */
  choices?: TrackOptionDto[];
  /** Pinned to the bottom on a phone, so results open upwards there. */
  pinned?: boolean;
  /** Before a round exists there is nothing to guess or skip. */
  disabled?: boolean;
}

interface TrackRowProps {
  tracks: TrackOptionDto[];
  onSelect: (track: TrackOptionDto) => void;
}

function TrackRow({
  index,
  style,
  tracks,
  onSelect,
}: RowComponentProps<TrackRowProps>) {
  const track = tracks[index];
  const isLast = index === tracks.length - 1;

  return (
    <button
      type="button"
      style={style}
      onClick={() => onSelect(track)}
      className={`w-full flex items-center gap-3 px-3 sm:px-4 text-left hover:bg-fg/10 transition-colors touch-manipulation active:bg-fg/15${
        !isLast ? ' border-b border-fg/5' : ''
      }`}
    >
      {track.albumImageUrl ? (
        <Image
          src={track.albumImageUrl}
          alt=""
          width={40}
          height={40}
          className="rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-fg/10 flex items-center justify-center flex-shrink-0">
          <Disc3 className="w-5 h-5 text-[#535353]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg truncate">{track.name}</p>
        <p className="text-sm text-fg/50 truncate">{track.artist}</p>
      </div>
    </button>
  );
}

export function GuessInput({
  search,
  onSubmit,
  onSkip,
  submitPending,
  gameMode,
  nextSnippetDuration,
  choices,
  pinned = false,
  disabled = false,
}: GuessInputProps) {
  const isBelowSm = useIsBelowSm();
  const givesUp = gameMode === GameMode.Gauntlet || !nextSnippetDuration;
  const {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    selectedTrack,
    filteredTracks,
    isLoading,
    searchRef,
    handleSelectTrack,
    handleClearSelection,
  } = search;

  const dropdownOpen = showDropdown && searchQuery.length > 0 && !selectedTrack;
  const listHeight = Math.min(
    filteredTracks.length * ITEM_HEIGHT,
    MAX_VISIBLE_ITEMS * ITEM_HEIGHT,
  );

  return (
    <div
      className="rounded-2xl p-3 sm:p-4 space-y-3"
      style={{
        background: 'rgb(var(--fg) / 0.05)',
        border: '1px solid rgb(var(--fg) / 0.09)',
      }}
    >
      {choices?.length ? (
        <div
          role="radiogroup"
          aria-label="Pick the song"
          className="grid grid-cols-2 gap-2"
        >
          {choices.map((choice) => {
            const isSelected = choice.id === selectedTrack?.id;
            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectTrack(choice)}
                className={`min-h-[52px] rounded-xl px-3 py-2 text-left sm:min-h-[56px] sm:px-4 sm:py-3 transition-colors touch-manipulation ${
                  isSelected
                    ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                    : 'border border-fg/[0.08] bg-fg/[0.06] text-fg hover:bg-fg/10'
                }`}
              >
                <p className="truncate text-sm font-semibold sm:text-base">
                  {choice.name}
                </p>
                <p
                  className={`truncate text-xs sm:text-sm ${isSelected ? 'text-black/70' : 'text-fg/50'}`}
                >
                  {choice.artist}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <Popover open={dropdownOpen} modal={false}>
          <div ref={searchRef}>
            {selectedTrack ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl text-black min-h-[56px]"
                style={{
                  background: '#1DB954',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 0 20px rgba(29,185,84,0.3)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selectedTrack.name}</p>
                  <p className="text-sm text-black/70 truncate">
                    {selectedTrack.artist}
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleClearSelection}
                  aria-label="Clear selection"
                  className="p-2 hover:bg-black/10 rounded-full transition-colors"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ) : (
              <PopoverAnchor asChild>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[#535353]">
                    <Search className="w-5 h-5 pointer-events-none" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    disabled={disabled}
                    placeholder={
                      disabled ? 'Press play to start' : 'Search for a song...'
                    }
                    // Ring colour is set unconditionally and only the width
                    // changes on focus: transitioning the colour too animates it
                    // up from Tailwind's default, which flashes pale blue first.
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-base sm:text-sm text-fg placeholder-[#535353] outline-none ring-0 ring-[#1DB954]/50 focus:ring-2 transition-[box-shadow,border-color] duration-200 min-h-[44px] touch-manipulation"
                    style={{
                      background: 'rgb(var(--fg) / 0.06)',
                      border: '1px solid rgb(var(--fg) / 0.08)',
                    }}
                  />
                </div>
              </PopoverAnchor>
            )}
          </div>

          <PopoverContent
            className="p-0 w-[--radix-popover-trigger-width] overflow-hidden rounded-xl border border-fg/10 shadow-2xl"
            style={{
              background: 'rgb(var(--surface) / 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgb(var(--fg) / 0.06)',
            }}
            side={pinned && isBelowSm ? 'top' : 'bottom'}
            avoidCollisions={false}
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (
                searchRef.current &&
                searchRef.current.contains(e.target as Node)
              ) {
                e.preventDefault();
                return;
              }
              setShowDropdown(false);
            }}
          >
            {filteredTracks.length > 0 ? (
              <List<TrackRowProps>
                rowComponent={TrackRow}
                rowCount={filteredTracks.length}
                rowHeight={ITEM_HEIGHT}
                rowProps={{
                  tracks: filteredTracks,
                  onSelect: handleSelectTrack,
                }}
                style={{
                  // Never past the edge of the window: the list scrolls inside
                  // itself rather than making the page scroll to reach it.
                  height: `min(${listHeight}px, calc(var(--radix-popover-content-available-height) - 12px))`,
                  overscrollBehavior: 'contain',
                }}
              />
            ) : (
              <div className="p-4 text-[#b3b3b3] text-center text-sm">
                {isLoading
                  ? 'Searching...'
                  : searchQuery.trim().length < MIN_QUERY_LENGTH
                    ? `Type at least ${MIN_QUERY_LENGTH} characters`
                    : 'No songs found'}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Side by side, but not the same weight: submitting is the move,
          skipping is the way out. */}
      <div className="flex items-stretch gap-2">
        <motion.button
          type="button"
          onClick={onSubmit}
          aria-label="Submit guess"
          disabled={!selectedTrack || submitPending || disabled}
          whileHover={selectedTrack && !submitPending ? { scale: 1.02 } : {}}
          whileTap={selectedTrack && !submitPending ? { scale: 0.98 } : {}}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all min-h-[44px] touch-manipulation ${
            selectedTrack && !submitPending && !disabled
              ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1DB954]/20 active:scale-95'
              : 'bg-fg/10 text-fg/30 border border-fg/[0.12] cursor-not-allowed'
          }`}
        >
          {submitPending ? 'Checking...' : 'Submit'}
        </motion.button>
        <button
          type="button"
          onClick={onSkip}
          disabled={submitPending || disabled}
          aria-label={givesUp ? 'Give up' : 'Skip this round'}
          className="shrink-0 px-5 sm:px-6 rounded-xl border border-fg/15 text-fg/50 hover:text-fg/80 hover:border-fg/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors touch-manipulation"
        >
          {givesUp || !nextSnippetDuration
            ? 'Give up'
            : `Skip · ${formatSeconds(nextSnippetDuration)}`}
        </button>
      </div>
    </div>
  );
}
