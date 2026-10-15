'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Disc3 } from 'lucide-react';
import type { TrackOptionDto } from '@/sdk';

interface TrackSelectOptionsProps {
  trackOptions: TrackOptionDto[];
  selectedTrack: TrackOptionDto | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectTrack: (track: TrackOptionDto) => void;
  onClearSelection: () => void;
  placeholder?: string;
}

export function TrackSelectOptions({
  trackOptions,
  selectedTrack,
  searchQuery,
  onSearchChange,
  onSelectTrack,
  onClearSelection,
  placeholder = 'Search from your tracks...',
}: TrackSelectOptionsProps) {
  const query = searchQuery.trim().toLowerCase();
  const filtered = !query
    ? trackOptions
    : trackOptions.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query),
      );

  return (
    <div className="mb-4">
      {selectedTrack ? (
        <div className="flex items-center gap-3 p-4 bg-spotify-green text-black rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedTrack.name}</p>
            <p className="text-sm text-black/70 truncate">
              {selectedTrack.artist}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-4 bg-fg/10 rounded-lg text-fg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green"
          />
        </div>
      )}
      <AnimatePresence>
        {searchQuery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 max-h-60 overflow-y-auto rounded-lg bg-zinc-800/90 border border-fg/10"
          >
            {filtered.length > 0 ? (
              filtered.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => onSelectTrack(track)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-fg/10 border-b border-fg/5 last:border-b-0 transition-colors"
                >
                  {track.albumImageUrl ? (
                    <Image
                      src={track.albumImageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-fg/10 flex items-center justify-center flex-shrink-0">
                      <Disc3 className="w-5 h-5 text-fg/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-gray-400 text-center">
                No matches. Try another search.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
