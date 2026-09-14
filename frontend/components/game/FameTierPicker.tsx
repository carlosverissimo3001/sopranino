'use client';

import type { FameTier } from '@/sdk';
import { FAME_TIERS } from '@/lib/fame-tier';

interface FameTierPickerProps {
  value: FameTier;
  onChange: (tier: FameTier) => void;
  /** The tier the open round was drawn from, when a change waits for the next song. */
  playing?: FameTier;
  disabled?: boolean;
}

export function FameTierPicker({
  value,
  onChange,
  playing,
  disabled = false,
}: FameTierPickerProps) {
  const waits = !!playing && playing !== value;

  return (
    <div className="mb-3 flex flex-col items-center gap-1.5 sm:mb-5">
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
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-50 sm:px-3 sm:text-xs ${
              value === tier.value ? tier.accent : 'text-fg/40 hover:text-fg/70'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>
      {waits && <p className="text-[11px] text-fg/40">From the next song</p>}
    </div>
  );
}
