'use client';

import type { FameTier } from '@/sdk';
import { FAME_TIERS } from '@/lib/fame-tier';

interface FameTierPickerProps {
  value: FameTier;
  onChange: (tier: FameTier) => void;
  /** The tier the open round was drawn from, when a change waits for the next song. */
  playing?: FameTier;
  disabled?: boolean;
  className?: string;
  /** Off where the page says it next to other notes, outside the picker's row. */
  showWaitNote?: boolean;
}

export function FameTierPicker({
  value,
  onChange,
  playing,
  disabled = false,
  className = 'mb-3 sm:mb-5',
  showWaitNote = true,
}: FameTierPickerProps) {
  const waits = !!playing && playing !== value;

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div
        role="radiogroup"
        aria-label="How well-known the songs are"
        className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-fg/5 p-1"
      >
        {FAME_TIERS.map((tier) => (
          <button
            key={tier.value}
            type="button"
            role="radio"
            aria-checked={value === tier.value}
            disabled={disabled}
            onClick={() => onChange(tier.value)}
            className={`shrink-0 rounded-full border border-transparent px-2.5 py-px text-[11px] font-bold transition-colors disabled:opacity-50 sm:py-[3px] ${
              waits && playing === tier.value
                ? // The song on screen keeps its colour; the queued pick is amber.
                  tier.accent
                : waits && value === tier.value
                  ? 'border-amber-400/60 text-amber-300'
                  : !waits && value === tier.value
                    ? tier.accent
                    : 'text-fg/40 hover:text-fg/70'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>
      {waits && showWaitNote && (
        <p className="text-[11px] text-amber-300/80">From the next song</p>
      )}
    </div>
  );
}
