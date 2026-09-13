'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, ChevronDown, ChevronUp, Check, Music2 } from 'lucide-react';
import { formatSeconds, snippetSeconds } from '@/lib/snippet-timeline';
import { Button } from '@/components/ui/button';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';
import {
  GameHistoryEntryDtoStatusEnum,
  type GameHistoryEntryDto,
} from '@/sdk/models/GameHistoryEntryDto';
import { formatDate } from '@/utils/date-utils';
import { cardVariants } from './card-motion';

const GUESS_LABEL: Record<string, string> = {
  [GuessHistoryDtoResultEnum.Correct]: 'Correct',
  [GuessHistoryDtoResultEnum.Artist]: 'Right artist',
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: 'Right artist & album',
  [GuessHistoryDtoResultEnum.Album]: 'Right album',
  [GuessHistoryDtoResultEnum.Wrong]: 'Wrong',
  [GuessHistoryDtoResultEnum.Skip]: 'Skipped',
};

const GUESS_BORDER: Record<string, string> = {
  [GuessHistoryDtoResultEnum.Correct]: 'border-l-green-500',
  [GuessHistoryDtoResultEnum.Artist]: 'border-l-yellow-500',
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: 'border-l-yellow-500',
  [GuessHistoryDtoResultEnum.Album]: 'border-l-yellow-500',
  [GuessHistoryDtoResultEnum.Wrong]: 'border-l-red-500',
  [GuessHistoryDtoResultEnum.Skip]: 'border-l-white/30',
};

const STATUS_SIDEBAR_CLASSES: Record<string, string> = {
  [GameHistoryEntryDtoStatusEnum.Won]: 'bg-spotify-green',
  [GameHistoryEntryDtoStatusEnum.Lost]: 'bg-red-500',
  [GameHistoryEntryDtoStatusEnum.Abandoned]: 'bg-fg/30',
};

interface HistoryCardProps {
  entry: GameHistoryEntryDto;
  onShare: (id: string) => void;
  copied: boolean;
  showWinnerGlow?: boolean;
  staggerIndex?: number;
}

/**
 * Which guess it took, and how much of the song that gave you. The seconds are
 * the part worth knowing: a win on guess two is a track named off one second.
 */
function Outcome({
  round,
  status,
}: {
  round: number;
  status: GameHistoryEntryDto['status'];
}) {
  if (status !== GameHistoryEntryDtoStatusEnum.Won) {
    return (
      <span className="text-xs text-fg/40">
        {status === GameHistoryEntryDtoStatusEnum.Abandoned
          ? 'Abandoned'
          : 'Lost'}
      </span>
    );
  }

  return (
    <span className="text-xs text-fg/40">
      Guessed in{' '}
      <span className="font-semibold text-spotify-green">
        {formatSeconds(snippetSeconds(round))}
      </span>
    </span>
  );
}

export function HistoryCard({
  entry,
  onShare,
  copied,
  showWinnerGlow = false,
  staggerIndex = 0,
}: HistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isWon = entry.status === GameHistoryEntryDtoStatusEnum.Won;

  // Note: maybe simplify this logic in the future
  const guessesUsed =
    isWon && entry.score != null && entry.score >= 1 && entry.score <= 6
      ? 7 - entry.score
      : (entry.score ?? 0);

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={staggerIndex}
      onClick={() => entry.guesses.length > 0 && setExpanded(!expanded)}
      className={`group rounded-2xl bg-fg/[0.03] border overflow-hidden transition-colors duration-200 ${
        entry.guesses.length > 0 ? 'cursor-pointer' : ''
      } ${
        showWinnerGlow
          ? 'border-spotify-green/40 shadow-[0_0_20px_rgba(29,185,84,0.12)]'
          : 'border-fg/10'
      }`}
    >
      <div className="flex">
        {/* Status Side-Bar */}
        <div
          className={`w-1 shrink-0 ${STATUS_SIDEBAR_CLASSES[entry.status]}`}
        />

        <div className="p-4 flex-1 min-w-0">
          <div className="flex gap-4 items-start">
            {/* Album Art */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-fg/10 shrink-0 shadow-lg">
              {entry.albumImageUrl ? (
                <Image
                  src={entry.albumImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-fg/20" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-fg/40">
                  {formatDate(entry.date)}
                </span>
              </div>

              <h3 className="font-bold text-fg truncate text-sm sm:text-base">
                {entry.trackName}
              </h3>
              <p className="text-xs sm:text-sm text-fg/50 truncate mb-3">
                by {entry.artistName}
              </p>

              <div className="flex items-center justify-between gap-3">
                <Outcome round={guessesUsed} status={entry.status} />

                <div className="flex shrink-0 items-center gap-1">
                  {entry.guesses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                      }}
                      className="h-8 rounded-full px-3 text-xs text-fg/40 hover:text-fg"
                    >
                      {expanded ? (
                        <ChevronUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      )}
                      {expanded ? 'Hide' : 'Guesses'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full transition-colors ${copied ? 'text-spotify-green' : 'text-fg/40'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(entry.id);
                    }}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Guesses Logic */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-fg/5 space-y-1.5">
                  {entry.guesses.map((g, i) => {
                    const round = i + 1;

                    // A skipped round is a gap in the sequence, not an entry.
                    // Without it a win on round two shows a single row and the
                    // header's timing looks wrong.
                    if (g.result === GuessHistoryDtoResultEnum.Skip) {
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-1 text-[10px] text-fg/25"
                        >
                          <span className="w-3 shrink-0 tabular-nums">
                            {round}
                          </span>
                          <span className="h-px flex-1 bg-fg/[0.07]" />
                          <span>Skipped</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-fg/[0.02] border-l-2 ${GUESS_BORDER[g.result]}`}
                      >
                        <span className="w-3 shrink-0 text-[10px] tabular-nums text-fg/25">
                          {round}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-fg/90 truncate font-medium">
                            {g.trackName}
                          </p>
                          <p className="text-[10px] text-fg/40 truncate">
                            by {g.artistName}
                          </p>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-fg/30 whitespace-nowrap">
                          {GUESS_LABEL[g.result]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
