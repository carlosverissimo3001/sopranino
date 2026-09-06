'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  EyeOff,
  Flame,
  Medal,
  Trophy,
  Zap,
} from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useGauntletLeaderboard } from '@/hooks/speed-run/useSpeedrunLeaderboard';
import {
  GauntletControllerGetLeaderboardDifficultyEnum as Difficulty,
  GauntletControllerGetLeaderboardPeriodEnum as Period,
} from '@/sdk/apis/ApiApi';
import { SNIPPET_STEPS } from '@/lib/snippet-timeline';
import type { GauntletLeaderboardEntryDto } from '@/sdk/models/GauntletLeaderboardEntryDto';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

const PERIODS: { value: Period; label: string }[] = [
  { value: Period.Daily, label: 'Today' },
  { value: Period.Weekly, label: 'This Week' },
  { value: Period.Alltime, label: 'All Time' },
];

// A 7s run and a 1s run are not the same feat, so each ranks on its own board.
const DIFFICULTIES: { value: Difficulty; label: string; duration: string }[] = [
  { value: Difficulty.Easy, label: 'Easy', duration: `${SNIPPET_STEPS[4]}s` },
  {
    value: Difficulty.Medium,
    label: 'Medium',
    duration: `${SNIPPET_STEPS[3]}s`,
  },
  { value: Difficulty.Hard, label: 'Hard', duration: `${SNIPPET_STEPS[2]}s` },
  {
    value: Difficulty.Expert,
    label: 'Expert',
    duration: `${SNIPPET_STEPS[1]}s`,
  },
];

const PODIUM_STYLES: Record<
  number,
  { ring: string; bg: string; text: string; icon: typeof Crown }
> = {
  1: {
    ring: 'ring-amber-400/40',
    bg: 'bg-gradient-to-br from-amber-400/30 to-amber-500/15 border-amber-500/40 dark:from-amber-400/15 dark:to-amber-600/5 dark:border-amber-400/25',
    text: 'text-amber-600 dark:text-amber-300',
    icon: Crown,
  },
  2: {
    ring: 'ring-slate-300/30',
    bg: 'bg-gradient-to-br from-slate-400/25 to-slate-500/12 border-slate-400/45 dark:from-slate-300/10 dark:to-slate-400/5 dark:border-slate-400/20',
    text: 'text-slate-600 dark:text-slate-300',
    icon: Medal,
  },
  3: {
    ring: 'ring-orange-700/30',
    bg: 'bg-gradient-to-br from-orange-600/25 to-orange-700/12 border-orange-700/40 dark:from-orange-700/12 dark:to-orange-800/5 dark:border-orange-700/20',
    text: 'text-orange-700 dark:text-orange-400',
    icon: Medal,
  },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const style = PODIUM_STYLES[rank];
    const Icon = style.icon;
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg} border`}
      >
        <Icon className={`w-4 h-4 ${style.text}`} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-fg/[0.04] border border-fg/8">
      <span className="text-xs font-black tabular-nums text-fg/40">{rank}</span>
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  staggerIndex,
}: {
  entry: GauntletLeaderboardEntryDto;
  isCurrentUser: boolean;
  staggerIndex: number;
}) {
  const isPodium = entry.rank <= 3;
  const podiumStyle = isPodium ? PODIUM_STYLES[entry.rank] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: staggerIndex * 0.03 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
        isCurrentUser
          ? 'bg-spotify-green/[0.12] border-spotify-green/40 dark:bg-spotify-green/[0.06] dark:border-spotify-green/20 shadow-[0_0_20px_rgba(30,215,96,0.06)]'
          : isPodium
            ? `${podiumStyle!.bg}`
            : 'bg-fg/[0.04] border-fg/12 dark:bg-fg/[0.02] dark:border-fg/6 hover:border-fg/20 dark:hover:border-fg/12'
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="w-9 h-9 rounded-full overflow-hidden bg-fg/[0.06] border border-fg/8 shrink-0">
        {entry.isHidden ? (
          <div className="w-full h-full flex items-center justify-center text-fg/25">
            <EyeOff className="w-4 h-4" />
          </div>
        ) : entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-black text-fg/30">
            {entry.displayName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-bold truncate ${
            isCurrentUser
              ? 'text-spotify-green'
              : entry.isHidden
                ? 'text-fg/40 italic'
                : isPodium
                  ? 'text-fg'
                  : 'text-fg/80'
          }`}
        >
          {entry.displayName}
          {isCurrentUser && (
            <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-spotify-green/60">
              You
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Zap
          className={`w-3.5 h-3.5 ${
            entry.score >= 10
              ? 'text-amber-400'
              : entry.score >= 5
                ? 'text-spotify-green'
                : 'text-fg/25'
          }`}
        />
        <span
          className={`text-lg font-black tabular-nums ${
            isPodium ? podiumStyle!.text : 'text-fg/70'
          }`}
        >
          {entry.score}
        </span>
      </div>
    </motion.div>
  );
}

export function SpeedRunLeaderboard() {
  const [period, setPeriod] = useState<Period>(Period.Alltime);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const { data: user } = useMe();
  const { data, isLoading, error } = useGauntletLeaderboard(
    period,
    difficulty,
    !!user,
  );
  const router = useRouter();

  const entries = data?.entries ?? [];
  const userEntry = data?.userEntry;
  const userInList = entries.some((e) => e.userId === user?.userId);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">
            Leaderboard
          </h1>
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-fg/40 text-sm">
          The best runs on the curated pool. Everyone here played the same
          tracks at the same length.
        </p>
      </div>

      {/* Period Tabs */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-fg/[0.03] border border-fg/8">
          {PERIODS.map((p) => {
            const isActive = period === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-1.5 rounded-[10px] text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-amber-500/30 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 shadow-sm'
                    : 'text-fg/40 hover:text-fg/70'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 p-1 rounded-full bg-fg/[0.03] border border-fg/8">
          {DIFFICULTIES.map((d) => {
            const isActive = difficulty === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums transition-all ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300'
                    : 'text-fg/40 hover:text-fg/70'
                }`}
              >
                {d.duration}
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide opacity-60">
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Failed to load leaderboard
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Flame className="w-8 h-8 text-fg/20 mx-auto" />
          <p className="text-fg/40 text-sm">
            No ranked runs yet{' '}
            {period === Period.Daily
              ? 'today'
              : period === Period.Weekly
                ? 'this week'
                : ''}
            . Be the first!
          </p>
          <Link
            href="/speed-run"
            className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:underline text-sm font-semibold"
          >
            <Zap className="w-4 h-4" />
            Start a Run
          </Link>
        </div>
      ) : (
        <motion.div
          key={`${period}-${difficulty}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={`${entry.userId}-${entry.rank}`}
              entry={entry}
              isCurrentUser={entry.userId === user?.userId}
              staggerIndex={i}
            />
          ))}

          {/* Pinned user row if they're not in the visible list */}
          {userEntry && !userInList && (
            <>
              <div className="flex items-center gap-3 px-4 py-1">
                <div className="flex-1 border-t border-dashed border-fg/10" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-fg/25">
                  Your rank
                </span>
                <div className="flex-1 border-t border-dashed border-fg/10" />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-spotify-green/[0.12] border-spotify-green/40 dark:bg-spotify-green/[0.06] dark:border-spotify-green/20 shadow-[0_0_20px_rgba(30,215,96,0.06)]">
                <RankBadge rank={userEntry.rank} />

                <div className="w-9 h-9 rounded-full overflow-hidden bg-fg/[0.06] border border-fg/8 shrink-0">
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-fg/30">
                      {user?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-spotify-green truncate">
                    {user?.displayName}
                    <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-spotify-green/60">
                      You
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      userEntry.score >= 10
                        ? 'text-amber-400'
                        : userEntry.score >= 5
                          ? 'text-spotify-green'
                          : 'text-fg/25'
                    }`}
                  />
                  <span className="text-lg font-black tabular-nums text-spotify-green">
                    {userEntry.score}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
