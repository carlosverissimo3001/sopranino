'use client';

import { AskForASet } from './AskForASet';

/**
 * The last card in the artists row. Somebody who has scrolled to the end of
 * the artists is exactly the person who did not find theirs.
 */
export function AskForASetCard() {
  return (
    <div className="mx-auto flex aspect-[220/289] w-full max-w-[400px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-fg/15 bg-fg/[0.02] p-3 text-center transition-colors hover:border-fg/30 sm:rounded-2xl sm:p-5">
      <AskForASet variant="card" />
    </div>
  );
}
