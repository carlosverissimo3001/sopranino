'use client';

import { Snowflake } from 'lucide-react';
import type { StreakFreezeUsageDto } from '@/sdk/models/StreakFreezeUsageDto';
import { formatDateRange } from '@/utils/date-utils';

interface FreezeHistoryCardProps {
  usage: StreakFreezeUsageDto;
}

export function FreezeHistoryCard({ usage }: FreezeHistoryCardProps) {
  return (
    <article className="group relative rounded-xl overflow-hidden border border-cyan-400/[0.12]">
      <div className="absolute inset-0 bg-surface dark:bg-gradient-to-r dark:from-[#091520] dark:via-[#0b1a28] dark:to-[#060d14]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(34,211,238,0.06),transparent)]" />

      <div className="relative flex">
        <div className="w-1 shrink-0 bg-gradient-to-b from-cyan-400 via-cyan-500 to-teal-500" />

        <div className="px-3.5 py-2.5 flex-1 min-w-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/10 flex items-center justify-center shrink-0">
            <Snowflake className="w-4 h-4 text-cyan-400/60" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg/80">
                Streak saved
              </span>
              <span className="text-[10px] text-cyan-400/40">
                {usage.freezesUsed}{' '}
                {usage.freezesUsed === 1 ? 'freeze' : 'freezes'} used
              </span>
            </div>
            <p className="text-[11px] text-fg/30">
              {formatDateRange(usage.coveredFrom, usage.coveredTo)}
              <span className="text-amber-400/40 ml-1.5">
                · {usage.streakAtTime} day streak protected
              </span>
            </p>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-cyan-500/10 border-cyan-400/20 text-cyan-400 shrink-0">
            Saved
          </span>
        </div>
      </div>
    </article>
  );
}
