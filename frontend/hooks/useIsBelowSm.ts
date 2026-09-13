'use client';

import { useSyncExternalStore } from 'react';

/** Tailwind's `sm` breakpoint. */
const BELOW_SM = '(max-width: 639px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(BELOW_SM);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** For what CSS cannot switch. False on the server, so a desktop never flips. */
export function useIsBelowSm(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(BELOW_SM).matches,
    () => false,
  );
}
