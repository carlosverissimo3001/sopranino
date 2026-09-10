'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  BarChart3,
  Flame,
  Trophy,
  Users,
  Plus,
  Loader2,
  Gamepad2,
  Shuffle,
} from 'lucide-react';
import { usePlayedToday } from '@/hooks/game/usePlayedToday';
import { DailyChallengeCountdown } from './DailyChallangeCountdown';
import { usePersonalBest } from '@/hooks/speed-run/useSpeedRunPersonalBest';
import { JoinRoomModal } from '@/components/multiplayer/JoinRoomModal';
import { useCreateAndEnterRoom } from '@/hooks/multiplayer/useCreateAndEnterRoom';
import { cn } from '@/lib/utils';

const cardPadding = 'p-4 sm:p-6';

/** Corner glow per mode. A gradient, not a blur filter: iOS WebKit won't clip a filtered layer to the card's radius. */
const modeGlow: Record<string, string> = {
  daily: '#1DB954',
  pool: '#0ea5e9',
  speedrun: '#ea580c',
  multiplayer: '#9333ea',
};

function DailyCardContent() {
  const { data: playedTodayData, isLoading: playedTodayLoading } =
    usePlayedToday();
  const playedToday = playedTodayData?.playedToday ?? false;
  const showAsPlayed = playedTodayLoading ? true : playedToday;

  return (
    <div
      className={cn(
        'h-full flex flex-col justify-between relative z-10 w-full',
        cardPadding,
      )}
    >
      <div className="flex flex-col gap-1 sm:gap-2 mb-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-spotify-green/10 border border-spotify-green/20 w-fit text-[10px] uppercase tracking-widest font-black text-spotify-green">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Sparkles className="w-3 h-3 fill-current" />
          </motion.div>
          <span>Daily Event</span>
        </div>
        <div className="space-y-0.5">
          <h2 className="font-black tracking-tighter text-fg text-2xl sm:text-3xl leading-tight">
            The <span className="text-spotify-green">Mystery</span>
          </h2>
          {showAsPlayed && !playedTodayLoading ? (
            <DailyChallengeCountdown />
          ) : (
            <p className="text-fg/50 text-xs sm:text-sm tracking-tight">
              One song. Six chances. Guess in 1s.
            </p>
          )}
        </div>
      </div>

      <div className="w-full">
        <Link
          href={showAsPlayed ? '/history?filter=daily' : '/daily'}
          className={cn(
            'flex items-center justify-center gap-2 h-10 sm:h-12 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all hover:brightness-110 active:scale-90 w-fit',
            showAsPlayed
              ? 'bg-spotify-green/10 text-spotify-green border border-spotify-green/30'
              : 'bg-spotify-green text-black shadow-[0_8px_20px_rgba(30,215,96,0.3)]',
          )}
        >
          {showAsPlayed ? (
            <>
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </>
          ) : (
            <>
              <Play fill="currentColor" className="w-4 h-4" />
              <span>Play Now</span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

function PoolCardContent() {
  return (
    <div
      className={cn(
        'h-full flex flex-col justify-between relative z-10 w-full',
        cardPadding,
      )}
    >
      <div className="flex flex-col gap-1 sm:gap-2 mb-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 w-fit text-[10px] uppercase tracking-widest font-black text-sky-600 dark:text-sky-400">
          <Shuffle className="w-3 h-3" />
          <span>Random</span>
        </div>
        <div className="space-y-0.5">
          <h2 className="font-black tracking-tighter text-fg text-xl sm:text-2xl leading-tight">
            The{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-400">
              Shuffle
            </span>
          </h2>
          <p className="text-fg/50 text-xs sm:text-sm tracking-tight">
            Any song, any era. No playlist needed.
          </p>
        </div>
      </div>

      <div className="w-full">
        <Link
          href="/shuffle"
          className="flex items-center justify-center gap-2 h-10 sm:h-12 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-sky-500 shadow-[0_8px_20px_rgba(14,165,233,0.2)] transition-all hover:brightness-110 active:scale-90 w-fit"
        >
          <Play fill="currentColor" className="w-4 h-4" />
          <span>Play</span>
        </Link>
      </div>
    </div>
  );
}

function SpeedrunCardContent() {
  const { data: pbData } = usePersonalBest(true);
  const personalBest = pbData?.personalBest ?? 0;

  return (
    <div
      className={cn(
        'h-full flex flex-col justify-between relative z-10 w-full',
        cardPadding,
      )}
    >
      <div className="flex flex-col gap-1 sm:gap-2 mb-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit text-[10px] uppercase tracking-widest font-black text-orange-600 dark:text-orange-500">
          <Flame className="w-3 h-3 fill-current" />
          <span>Endless</span>
        </div>
        <div className="space-y-0.5">
          <h2 className="font-black tracking-tighter text-fg text-xl sm:text-2xl leading-tight">
            The{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-500">
              Speedrun
            </span>
          </h2>
          <p className="text-fg/50 text-xs sm:text-sm tracking-tight">
            {personalBest > 0
              ? `Personal Best: ${personalBest}`
              : 'No limits. High stakes.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full">
        <Link
          href="/speed-run"
          className="flex-[2] flex items-center justify-center gap-1.5 h-10 sm:h-12 rounded-2xl text-xs sm:text-sm font-black text-white transition-all active:scale-90 shadow-[0_8px_20px_rgba(249,115,22,0.2)]"
          style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
        >
          <Play fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Enter</span>
        </Link>
        <Link
          href="/speed-run/leaderboard"
          className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-auto sm:flex-1 sm:gap-1.5 lg:w-10 lg:flex-none lg:gap-0 rounded-2xl text-xs sm:text-sm font-black transition-all active:scale-95 border border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline lg:hidden">Leaderboard</span>
        </Link>
      </div>
    </div>
  );
}

function MultiplayerCardContent({
  onJoin,
  onCreate,
  isCreating,
}: {
  onJoin: () => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  return (
    <div
      className={cn(
        'h-full flex flex-col justify-between relative z-10 w-full',
        cardPadding,
      )}
    >
      <div className="flex flex-col gap-1 sm:gap-2 mb-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 w-fit text-[10px] uppercase tracking-widest font-black text-purple-600 dark:text-purple-400">
          <Gamepad2 className="w-3 h-3" />
          <span>Multiplayer</span>
        </div>
        <div className="space-y-0.5">
          <h2 className="font-black tracking-tighter text-fg text-xl sm:text-2xl leading-tight">
            With{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
              Friends
            </span>
          </h2>
          <p className="text-fg/50 text-xs sm:text-sm tracking-tight">
            Compete in real-time.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full">
        <button
          onClick={onJoin}
          className="flex cursor-pointer items-center justify-center h-10 w-10 sm:h-12 sm:w-auto sm:flex-1 sm:gap-1.5 lg:w-10 lg:flex-none lg:gap-0 rounded-2xl text-xs sm:text-sm font-black border border-fg/10 bg-fg/5 hover:bg-fg/10 text-fg transition-all active:scale-95"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline lg:hidden">Join</span>
        </button>

        <button
          onClick={onCreate}
          disabled={isCreating}
          className="flex-[2] flex cursor-pointer items-center justify-center gap-1.5 h-10 sm:h-12 rounded-2xl text-xs sm:text-sm font-black bg-purple-500 text-white shadow-[0_8px_20px_rgba(168,85,247,0.2)] active:scale-95 disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span>Create</span>
        </button>
      </div>
    </div>
  );
}

function GameModesGalleryComponent() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const createRoom = useCreateAndEnterRoom();

  const modes = [
    { id: 'daily', render: () => <DailyCardContent /> },
    { id: 'pool', render: () => <PoolCardContent /> },
    { id: 'speedrun', render: () => <SpeedrunCardContent /> },
    {
      id: 'multiplayer',
      render: () => (
        <MultiplayerCardContent
          onJoin={() => setShowJoinModal(true)}
          onCreate={createRoom.create}
          isCreating={createRoom.isPending}
        />
      ),
    },
  ];

  const gridClass = 'grid-cols-2 lg:grid-cols-4';

  return (
    <>
      {/* No entrance animation: these cards are what the page is for, and a
          stagger delays them for a reader who already knows what they say. */}
      <div className={cn('grid gap-3 sm:gap-3 mb-8 w-full', gridClass)}>
        {modes.map((mode) => {
          const isFullWidth = modes.length === 3 && mode.id === 'daily';
          return (
            <motion.div
              key={mode.id}
              whileTap={{ scale: 0.98 }}
              style={
                { '--mode-glow': modeGlow[mode.id] } as React.CSSProperties
              }
              className={cn(
                'group relative overflow-hidden rounded-[2rem] border border-fg/10 flex flex-col',
                'bg-surface dark:bg-[#0A0A0A]',
                'hover:bg-fg/[0.08] dark:hover:bg-fg/[0.08]',
                'shadow-[0_10px_30px_-15px_rgba(0,0,0,0.4)]',
                'hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6),0_0_24px_var(--mode-glow)]',
                'transition-[background-color,box-shadow] duration-300',
                isFullWidth ? 'col-span-2 lg:col-span-1' : 'col-span-1',
              )}
            >
              {mode.render()}

              <div
                className="absolute inset-0 pointer-events-none -z-0"
                style={{
                  background: `radial-gradient(340px circle at calc(100% + 2rem) -2rem, ${modeGlow[mode.id]}5C, ${modeGlow[mode.id]}1F 55%, transparent 80%)`,
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-br from-fg/[0.03] to-transparent pointer-events-none" />
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        <JoinRoomModal
          key="join-modal"
          open={showJoinModal}
          onClose={() => setShowJoinModal(false)}
        />
      </AnimatePresence>
    </>
  );
}

export const GameModesGallery = memo(GameModesGalleryComponent);
