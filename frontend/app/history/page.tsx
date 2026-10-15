'use client';

import { FloatingPaginationPill } from '@/components/history/FloatingPaginationPill';
import { FreezeHistoryCard } from '@/components/history/FreezeHistoryCard';
import { GauntletHistoryCard } from '@/components/history/GauntletHistoryCard';
import { HistoryCard } from '@/components/history/HistoryCard';
import { StreakLostCard } from '@/components/history/StreakLostCard';
import { HistoryFilter } from '@/components/history/HistoryFilter';
import { StatsPanel } from '@/components/history/StatsPanel';
import { SearchHeader } from '@/components/history/SearchHeader';
import { DifficultyFilter } from '@/components/history/DifficultyFilter';
import { StreakFreezeCard } from '@/components/history/StreakFreezeCard';
import {
  MODES,
  isHistoryTab,
  type HistoryTab,
} from '@/components/history/modes';
import { useMe } from '@/hooks/auth/useMe';
import { gameShareQueryOptions } from '@/hooks/game/useGameShare';
import { DEFAULT_PAGE_SIZE, type PageSize } from '@/hooks/game/useGameHistory';
import { useModeHistory } from '@/hooks/history/useModeHistory';
import type { GauntletDifficultyFilter } from '@/hooks/speed-run/useSpeedRunHistory';
import { usePlayedToday } from '@/hooks/game/usePlayedToday';
import { buildTimeline } from '@/utils/history-timeline';
import { GameHistoryEntryDtoStatusEnum } from '@/sdk/models/GameHistoryEntryDto';
import { GameControllerGetHistoryStatusEnum as GameStatusFilter } from '@/sdk/apis/ApiApi';
import { Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useGameStats } from '../../hooks/game/useGameStats';
import { GameStatsDtoModeEnum } from '../../sdk';

function HistoryPageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user, isLoading: isAuthLoading } = useMe();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const filter = searchParams.get('filter');
  const mode = MODES[isHistoryTab(filter) ? filter : 'all'];

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GameStatusFilter[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [difficulty, setDifficulty] = useState<
    GauntletDifficultyFilter | undefined
  >(undefined);

  const isFiltered = !!search || statusFilter.length > 0 || !!difficulty;

  const { data: stats } = useGameStats({
    mode: mode.statsMode ?? GameStatsDtoModeEnum.All,
    useCached: true,
    enabled: mode.statsMode !== null,
  });

  const { data: playedTodayData } = usePlayedToday({
    enabled: mode.tab === 'daily' && !!user,
  });

  const history = useModeHistory(mode, {
    page,
    pageSize,
    search,
    status: statusFilter,
    difficulty,
    enabled: !!user,
  });

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTabChange = useCallback(
    (tab: HistoryTab) => {
      setPage(1);
      setSearch('');
      setStatusFilter([]);
      setDifficulty(undefined);
      router.replace(tab === 'all' ? '/history' : `/history?filter=${tab}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: GameStatusFilter[]) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: PageSize) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const handleDifficultyChange = useCallback(
    (next?: GauntletDifficultyFilter) => {
      setDifficulty(next);
      setPage(1);
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter([]);
    setDifficulty(undefined);
    setPage(1);
  }, []);

  const timeline = useMemo(
    () =>
      buildTimeline(history.entries, history.freezeUsages, {
        markMissedDays: mode.tab === 'daily',
        isFiltered,
      }),
    [history.entries, history.freezeUsages, mode.tab, isFiltered],
  );

  const handleShare = useCallback(
    async (id: string) => {
      try {
        const result = await queryClient.fetchQuery(gameShareQueryOptions(id));
        if (result?.shareText) {
          await navigator.clipboard.writeText(result.shareText);
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        }
      } catch {
        toast.error('Failed to copy share text');
      }
    },
    [queryClient],
  );

  if (history.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {history.error instanceof Error
              ? history.error.message
              : 'Something went wrong'}
          </p>
          <Link href="/" className="text-spotify-green hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = isAuthLoading || history.isLoading;
  const hasNoResults = timeline.length === 0;

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto pb-24 relative">
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent"
        aria-hidden
      />

      <HistoryFilter
        activeTab={mode.tab}
        isTrusted={user?.isTrusted ?? false}
        onTabChange={handleTabChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-4">
          <StatsPanel
            mode={mode}
            stats={mode.statsMode ? stats : undefined}
            runSummary={history.runSummary}
          >
            {mode.tab === 'gauntlet' && (
              <DifficultyFilter
                selected={difficulty}
                onChange={handleDifficultyChange}
              />
            )}
          </StatsPanel>

          {mode.tab === 'daily' && (
            <StreakFreezeCard
              openQuiz={searchParams.get('earnFreezes') === '1'}
            />
          )}

          {mode.tab === 'daily' && playedTodayData && (
            <Link
              href="/daily"
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                playedTodayData.playedToday
                  ? 'bg-fg/[0.03] border border-fg/10 text-fg/40'
                  : 'bg-spotify-green/10 border border-spotify-green/20 text-spotify-green hover:bg-spotify-green/15'
              }`}
              aria-disabled={playedTodayData.playedToday}
            >
              <Play className="w-4 h-4" />
              {playedTodayData.playedToday
                ? 'Played today'
                : "Play today's daily"}
            </Link>
          )}
        </aside>

        <main className="lg:col-span-8">
          {mode.tab !== 'gauntlet' && (
            <SearchHeader
              search={search}
              onSearchChange={handleSearchChange}
              status={statusFilter}
              onStatusChange={handleStatusChange}
              totalItems={history.totalItems}
              isFiltered={isFiltered}
              onClearFilters={handleClearFilters}
            />
          )}

          {isLoading || history.isPlaceholderData ? (
            <HistorySkeleton count={pageSize} />
          ) : hasNoResults ? (
            isFiltered ? (
              <div className="text-center py-16">
                <p className="text-fg/40 text-sm">
                  Nothing here matches those filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-fg/60 transition-colors hover:bg-fg/[0.06] hover:text-fg"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-fg/40 text-sm">{mode.empty.message}</p>
                <Link
                  href={mode.empty.href}
                  className={`mt-4 inline-flex items-center gap-2 hover:underline text-sm ${mode.accent.text}`}
                >
                  <Play className="w-4 h-4" />
                  {mode.empty.cta}
                </Link>
              </div>
            )
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {timeline.map((entry) => {
                if (entry.type === 'freeze') {
                  return (
                    <FreezeHistoryCard
                      key={`freeze-${entry.data.id}`}
                      usage={entry.data}
                    />
                  );
                }
                if (entry.type === 'streak-lost') {
                  return (
                    <StreakLostCard
                      key={`lost-${entry.data.from}`}
                      from={entry.data.from}
                      to={entry.data.to}
                      gapDays={entry.data.gapDays}
                    />
                  );
                }
                if (entry.type === 'run') {
                  return (
                    <GauntletHistoryCard
                      key={entry.data.id}
                      entry={entry.data}
                      highlightBest={
                        history.runSummary != null &&
                        history.runSummary.bestScore > 0 &&
                        entry.data.score === history.runSummary.bestScore
                      }
                    />
                  );
                }
                return (
                  <HistoryCard
                    key={entry.data.id}
                    entry={entry.data}
                    onShare={handleShare}
                    copied={copiedId === entry.data.id}
                    // Six points is a win on the first guess. Anything
                    // looser lit most of the list and singled out nothing.
                    showWinnerGlow={
                      entry.data.status === GameHistoryEntryDtoStatusEnum.Won &&
                      entry.data.score === 6
                    }
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Floating Pagination Pill — fixed HUD at bottom */}
      <FloatingPaginationPill
        currentPage={page}
        totalPages={history.totalPages}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        isFetching={history.isPlaceholderData}
      />
    </div>
  );
}

/** Placeholders while the next page loads, shaped like the cards it replaces. */
function HistorySkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-fg/[0.03] border border-fg/10 overflow-hidden"
        >
          <div className="flex">
            <div className="w-1 shrink-0 bg-fg/10" />
            <div className="p-4 flex-1 flex gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-fg/[0.06] shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-2.5 w-20 rounded-full bg-fg/[0.06]" />
                <div className="h-3.5 w-3/4 rounded-full bg-fg/[0.08]" />
                <div className="h-3 w-1/2 rounded-full bg-fg/[0.05]" />
                <div className="flex gap-1.5 pt-1">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-5 rounded-full bg-fg/[0.06]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto pb-24">
          <HistorySkeleton count={DEFAULT_PAGE_SIZE} />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}
