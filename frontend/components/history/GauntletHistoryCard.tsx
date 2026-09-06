'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Music2, TimerReset, Zap } from 'lucide-react';
import type { GauntletHistoryEntryDto } from '@/sdk/models/GauntletHistoryEntryDto';
import {
  GauntletHistoryEntryDtoDifficultyEnum as Difficulty,
  GauntletHistoryEntryDtoSourceEnum as Source,
} from '@/sdk/models/GauntletHistoryEntryDto';
import { formatDate } from '@/utils/date-utils';
import { cardVariants } from './card-motion';

const DIFFICULTY_BADGE: Record<string, { label: string; classes: string }> = {
  [Difficulty.Easy]: {
    label: 'Easy',
    classes: 'bg-green-500/10 border-green-500/20 text-green-400',
  },
  [Difficulty.Medium]: {
    label: 'Medium',
    classes: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  },
  [Difficulty.Hard]: {
    label: 'Hard',
    classes: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  },
  [Difficulty.Expert]: {
    label: 'Expert',
    classes: 'bg-red-500/10 border-red-500/20 text-red-400',
  },
};

const MAX_TRACK_AVATARS = 5;

interface GauntletHistoryCardProps {
  entry: GauntletHistoryEntryDto;
  staggerIndex?: number;
  highlightBest?: boolean;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
}

export function GauntletHistoryCard({
  entry,
  staggerIndex = 0,
  highlightBest = false,
}: GauntletHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const difficulty =
    DIFFICULTY_BADGE[entry.difficulty] ?? DIFFICULTY_BADGE[Difficulty.Medium];
  const endingTrackIndex = Math.max(entry.tracks.length - 1, 0);

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={staggerIndex}
      className={`group overflow-hidden rounded-[22px] border transition-colors duration-200 ${
        highlightBest
          ? 'border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02)_35%,rgba(34,197,94,0.05)_100%)] shadow-[0_0_32px_rgba(245,158,11,0.08)]'
          : 'border-fg/10 bg-fg/[0.03]'
      }`}
    >
      <div className="flex">
        <div
          className="w-1 shrink-0"
          style={{
            background:
              entry.score >= 10
                ? 'linear-gradient(to bottom, #f59e0b, #ef4444)'
                : entry.score >= 5
                  ? '#22c55e'
                  : 'rgba(255,255,255,0.15)',
          }}
        />

        <div className="flex-1 min-w-0 p-3.5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex min-w-[68px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-fg/[0.05] px-3 py-2.5 shadow-inner shadow-black/10">
              <Zap
                className={`mb-1 h-3.5 w-3.5 ${entry.score >= 10 ? 'text-amber-400' : entry.score >= 5 ? 'text-spotify-green' : 'text-fg/30'}`}
              />
              <span
                className={`text-2xl font-black tabular-nums leading-none ${entry.score >= 10 ? 'text-amber-400' : entry.score >= 5 ? 'text-spotify-green' : 'text-fg/80'}`}
              >
                {entry.score}
              </span>
              <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-fg/35">
                Score
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-fg/40">
                    {formatDate(entry.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 bg-fg/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-fg/45">
                    <TimerReset className="h-3 w-3 text-fg/45" />
                    <span>{formatDuration(entry.durationSeconds)}</span>
                  </span>
                  {highlightBest ? (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                      Best
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* A run on your own playlist is yours to keep, but it was
                      never comparable with anyone else's. */}
                  {entry.source === Source.Playlist ? (
                    <span
                      title="Played on your own playlist, so it is not ranked"
                      className="rounded-full border border-fg/10 px-2 py-1 text-[10px] font-bold text-fg/40"
                    >
                      Practice
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-bold ${difficulty.classes}`}
                  >
                    {difficulty.label}
                  </span>
                </div>
              </div>

              {entry.tracks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-2 flex items-center gap-2 group/tracks"
                >
                  <div className="flex items-center">
                    {entry.tracks
                      .slice(0, MAX_TRACK_AVATARS)
                      .map((track, i) => (
                        <div
                          key={`${entry.id}-av-${track.id}-${i}`}
                          className="w-6 h-6 rounded-full overflow-hidden border-2 border-bg shrink-0"
                          style={{
                            marginLeft: i === 0 ? 0 : -6,
                            zIndex: MAX_TRACK_AVATARS - i,
                          }}
                        >
                          {track.albumImageUrl ? (
                            <Image
                              src={track.albumImageUrl}
                              alt=""
                              width={24}
                              height={24}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-fg/10 flex items-center justify-center">
                              <Music2 className="w-2.5 h-2.5 text-fg/25" />
                            </div>
                          )}
                        </div>
                      ))}
                    {entry.tracks.length > MAX_TRACK_AVATARS && (
                      <div
                        className="w-6 h-6 rounded-full bg-fg/10 border-2 border-bg flex items-center justify-center shrink-0"
                        style={{ marginLeft: -6 }}
                      >
                        <span className="text-[8px] font-bold text-fg/50">
                          +{entry.tracks.length - MAX_TRACK_AVATARS}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-fg/35 group-hover/tracks:text-fg/60 transition-colors">
                    {entry.tracks.length}{' '}
                    {entry.tracks.length === 1 ? 'track' : 'tracks'}
                  </span>
                  {expanded ? (
                    <ChevronUp className="h-3 w-3 text-fg/30 group-hover/tracks:text-fg/60 transition-colors" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-fg/30 group-hover/tracks:text-fg/60 transition-colors" />
                  )}
                </button>
              ) : null}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && entry.tracks.length > 0 ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 max-h-[340px] overflow-y-auto border-t border-fg/5 pt-4 pr-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {entry.tracks.map((track, index) => {
                    const isEndingTrack = index === endingTrackIndex;

                    return (
                      <div
                        key={`${entry.id}-${track.id}-${index}`}
                        className={`flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-fg/[0.02] border-l-2 ${
                          isEndingTrack
                            ? 'border-l-red-500'
                            : 'border-l-green-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-[10px] font-black tabular-nums text-fg/30 w-4 shrink-0 text-center">
                            {index + 1}
                          </span>
                          <div className="w-6 h-6 rounded overflow-hidden bg-fg/[0.06] shrink-0">
                            {track.albumImageUrl ? (
                              <Image
                                src={track.albumImageUrl}
                                alt=""
                                width={24}
                                height={24}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music2 className="w-3 h-3 text-fg/20" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-fg/85 truncate font-medium leading-tight">
                              {track.name}
                            </p>
                            <p className="text-[10px] text-fg/40 truncate leading-tight">
                              {track.artistName}
                            </p>
                          </div>
                        </div>
                        {isEndingTrack && (
                          <span className="text-[9px] font-bold text-red-400/70 whitespace-nowrap">
                            Lost
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
