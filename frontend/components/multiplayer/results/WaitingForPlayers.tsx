import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

import type { RoomPlayerDto } from '@/sdk';
import { HostDisconnectedBanner } from '../HostDisconnectedBanner';

interface WaitingForPlayersProps {
  players: RoomPlayerDto[];
  totalRounds: number;
  playerProgress: Map<string, number>;
  hostDisconnected: boolean;
}

export function WaitingForPlayers({
  players,
  totalRounds,
  playerProgress,
  hostDisconnected,
}: WaitingForPlayersProps) {
  return (
    <div
      className="flex min-h-screen min-h-[100dvh] justify-center py-10"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.1) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 my-auto w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mb-4 inline-block"
          >
            <Loader2 className="h-8 w-8 text-[#1DB954]" />
          </motion.div>
          <h2 className="mb-2 text-xl font-bold text-fg">
            Waiting for other players
          </h2>
          <p className="text-sm text-fg/40">
            Results will appear once everyone finishes
          </p>
        </div>

        {/* Host disconnected warning */}
        <AnimatePresence>
          {hostDisconnected && <HostDisconnectedBanner />}
        </AnimatePresence>

        {/* Player progress card */}
        {players.length > 0 && totalRounds > 0 && (
          <div className="grid gap-px overflow-hidden rounded-2xl border border-fg/10 bg-fg/5 sm:grid-cols-2">
            {players.map((player) => {
              const lastRoundIndex = playerProgress.get(player.userId);
              const completedRounds =
                lastRoundIndex !== undefined ? lastRoundIndex + 1 : 0;
              const isDone = completedRounds >= totalRounds;

              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 bg-bg px-4 py-3.5"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={player.displayName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border-2 border-fg/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-fg/10 border-2 border-fg/10 flex items-center justify-center text-sm font-bold text-fg/60">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Status indicator on avatar */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-bg flex items-center justify-center ${
                        isDone ? 'bg-green-500' : 'bg-fg/20'
                      }`}
                    >
                      {isDone ? (
                        <Check
                          className="w-2.5 h-2.5 text-fg"
                          strokeWidth={3}
                        />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]/60" />
                      )}
                    </div>
                  </div>

                  {/* Name + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-fg truncate">
                        {player.displayName}
                      </span>
                      <span
                        className={`text-xs font-mono shrink-0 ml-2 ${
                          isDone ? 'text-green-400 font-semibold' : 'text-fg/30'
                        }`}
                      >
                        {isDone ? 'Done' : `${completedRounds}/${totalRounds}`}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: totalRounds }, (_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < completedRounds
                              ? isDone
                                ? 'bg-green-500'
                                : 'bg-[#1DB954]'
                              : 'bg-fg/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
