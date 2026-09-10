import Image from 'next/image';
import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';
import type { ScoreboardRoundDto } from '@/sdk';

interface RoundBreakdownProps {
  rounds: ScoreboardRoundDto[];
}

function RoundBreakdownBase({ rounds }: RoundBreakdownProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  if (rounds.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="grid gap-2 sm:grid-cols-2">
        {rounds.map((round) => {
          const isExpanded = expandedRound === round.roundIndex;
          const contentId = `round-breakdown-${round.roundIndex}`;
          const solvedCount = round.players.filter((p) => p.won).length;
          const ordered = [...round.players].sort((a, b) => {
            if (a.won !== b.won) return a.won ? -1 : 1;
            return a.guessCount - b.guessCount;
          });

          return (
            <div
              key={round.roundIndex}
              className="overflow-hidden rounded-xl border border-fg/[0.08] bg-fg/[0.03] transition-colors hover:bg-fg/[0.05]"
            >
              <button
                onClick={() =>
                  setExpandedRound(isExpanded ? null : round.roundIndex)
                }
                aria-expanded={isExpanded}
                aria-controls={contentId}
                aria-label={`Toggle details for round ${round.roundIndex + 1}`}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fg/[0.08] text-xs font-bold text-fg/50">
                  {round.roundIndex + 1}
                </span>

                {round.albumImageUrl && (
                  <Image
                    src={round.albumImageUrl}
                    alt={round.trackName || 'Track'}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover shadow-md"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">
                    {round.trackName || 'Unknown track'}
                  </p>
                  {round.artistName && (
                    <p className="truncate text-xs text-fg/40">
                      {round.artistName}
                    </p>
                  )}
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-fg/35" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={contentId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-fg/[0.06] px-3.5 pb-3.5 pt-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg/35">
                        {solvedCount === 0
                          ? 'Nobody got it'
                          : `${solvedCount} of ${round.players.length} got it`}
                      </p>

                      {/* Bounded, or one expanded round in a twenty player game
                          is four hundred pixels of identical rows. */}
                      <div className="grid max-h-72 gap-1.5 overflow-y-auto sm:grid-cols-2">
                        {ordered.map((player) => (
                          <div
                            key={player.userId}
                            className="flex items-center gap-2 rounded-lg bg-fg/[0.03] px-2.5 py-1.5"
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                player.won ? 'bg-[#1DB954]/20' : 'bg-fg/[0.06]'
                              }`}
                            >
                              {player.won ? (
                                <Check
                                  className="h-2.5 w-2.5 text-[#1DB954]"
                                  strokeWidth={3}
                                />
                              ) : (
                                <X
                                  className="h-2.5 w-2.5 text-fg/30"
                                  strokeWidth={3}
                                />
                              )}
                            </div>
                            <span className="min-w-0 flex-1 truncate text-xs text-fg/75">
                              {player.displayName}
                            </span>
                            <span className="shrink-0 text-[10px] tabular-nums text-fg/30">
                              {player.guessCount}
                            </span>
                            <span
                              className={`shrink-0 text-[11px] font-bold tabular-nums ${
                                player.won ? 'text-[#1DB954]' : 'text-fg/40'
                              }`}
                            >
                              +{player.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const RoundBreakdown = memo(RoundBreakdownBase);
