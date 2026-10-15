'use client';

import { CARD_SHADOW } from '@/lib/styles';

/**
 * The card's own shape while it loads: same padding, same square cover, same
 * two lines under it, so nothing moves when the real one arrives.
 */
export function CardSkeleton() {
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-full max-w-[400px] overflow-hidden rounded-xl border border-fg/5 bg-surface p-3 sm:rounded-2xl sm:p-5 ${CARD_SHADOW}`}
    >
      <div className="absolute inset-0 z-20 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-fg/[0.05] to-transparent" />

      <div className="relative z-10 flex flex-col">
        <div className="mb-3 aspect-square w-full rounded-lg bg-fg/[0.08] sm:mb-5 sm:rounded-xl" />

        <div className="flex flex-col">
          {/* The title's own line height, so the card keeps its height. */}
          <div className="h-[20px] sm:h-[28px] flex items-center">
            <div className="h-3.5 w-2/3 rounded-full bg-fg/10 sm:h-5" />
          </div>
          <div className="mt-1.5 flex h-[13px] items-center sm:h-[15px]">
            <div className="h-2.5 w-1/3 rounded-full bg-fg/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}
