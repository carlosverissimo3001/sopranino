'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GameStatsDtoUnitEnum } from '@/sdk';
import type { GameStatsDto } from '@/sdk';
import type { GauntletHistorySummaryDto } from '@/sdk/models/GauntletHistorySummaryDto';
import type { ModeDescriptor } from './modes';
import { GuessDistribution } from './GuessDistribution';

interface Hero {
  value: string | number;
  label: string;
  caption: string;
}

interface Supporting {
  label: string;
  value: string | number;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** The number a mode is actually about, said once and said large. */
function gameHero(stats: GameStatsDto): Hero {
  const isDaily = stats.unit === GameStatsDtoUnitEnum.Days;

  return {
    value: stats.current,
    label: isDaily ? 'Day streak' : 'Win run',
    caption: isDaily
      ? `Best ${stats.best} ${stats.best === 1 ? 'day' : 'days'}`
      : `Best ${stats.best} in a row`,
  };
}

function gameSupporting(stats: GameStatsDto): Supporting[] {
  return [
    { label: 'Played', value: stats.totalGames },
    { label: 'Won', value: stats.totalWins },
    { label: 'Win rate', value: percent(stats.winRate) },
  ];
}

function runHero(summary: GauntletHistorySummaryDto): Hero {
  return {
    value: summary.bestScore,
    label: 'Best run',
    caption: `${summary.totalRuns} ${summary.totalRuns === 1 ? 'run' : 'runs'}`,
  };
}

function runSupporting(summary: GauntletHistorySummaryDto): Supporting[] {
  const answers = summary.totalCorrectAnswers + summary.totalRuns;
  return [
    {
      label: 'Avg. score',
      value: Number.isInteger(summary.averageScore)
        ? summary.averageScore
        : summary.averageScore.toFixed(1),
    },
    { label: 'Runs', value: summary.totalRuns },
    {
      label: 'Accuracy',
      value:
        answers === 0 ? '—' : percent(summary.totalCorrectAnswers / answers),
    },
  ];
}

interface StatsPanelProps {
  mode: ModeDescriptor;
  stats?: GameStatsDto;
  runSummary?: GauntletHistorySummaryDto;
  children?: React.ReactNode;
}

/**
 * The same panel on every tab, so switching tabs never changes the shape of
 * the page — only the numbers in it. Each mode leads with the figure it is
 * actually about rather than three equal tiles, two of which meant nothing.
 */
export function StatsPanel({
  mode,
  stats,
  runSummary,
  children,
}: StatsPanelProps) {
  const [chartOpen, setChartOpen] = useState(false);
  // Nothing played yet: a 5xl zero over three more zeroes reads as broken
  // rather than empty, so the panel says what would fill it instead.
  const isEmpty = runSummary
    ? runSummary.totalRuns === 0
    : !stats || stats.totalGames === 0;

  const hero = runSummary
    ? runHero(runSummary)
    : stats
      ? gameHero(stats)
      : null;

  const supporting = runSummary
    ? runSupporting(runSummary)
    : stats
      ? gameSupporting(stats)
      : [];

  const dash = (value: string | number) => (isEmpty ? '—' : value);

  return (
    <div className="rounded-2xl bg-fg/[0.03] border border-fg/10 backdrop-blur-sm overflow-hidden">
      <div className="p-4 lg:p-5">
        {/* One row on a phone, so the history is not pushed off the screen by
            the numbers above it; the column layout returns on a wide screen. */}
        <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3 lg:block">
          {hero && (
            <div>
              <div className="flex items-baseline gap-2.5">
                <span
                  className={`text-4xl font-black tabular-nums leading-none lg:text-5xl ${mode.accent.text}`}
                >
                  {dash(hero.value)}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-fg/40">
                  {hero.label}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-fg/35">{dash(hero.caption)}</p>
            </div>
          )}

          {supporting.length > 0 && (
            <dl className="flex gap-5 lg:mt-5 lg:grid lg:grid-cols-3 lg:gap-3 lg:border-t lg:border-fg/[0.07] lg:pt-4">
              {supporting.map((item) => (
                <div key={item.label}>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-fg/30">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-fg/80">
                    {dash(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {stats && (
          <>
            <button
              type="button"
              onClick={() => setChartOpen(!chartOpen)}
              aria-expanded={chartOpen}
              className="mt-4 flex w-full items-center justify-between border-t border-fg/[0.07] pt-4 text-[10px] font-bold uppercase tracking-widest text-fg/30 transition-colors hover:text-fg/50 lg:pointer-events-none lg:mt-5"
            >
              Won on guess
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform lg:hidden ${chartOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div className={`mt-3 ${chartOpen ? '' : 'hidden lg:block'}`}>
              <GuessDistribution
                distribution={stats.roundDistribution}
                barClass={mode.accent.bar}
              />
            </div>
          </>
        )}
      </div>

      {children}
    </div>
  );
}
