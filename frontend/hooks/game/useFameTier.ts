'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { FameTier } from '@/sdk';
import {
  currentFameTier,
  saveFameTier,
  subscribeFameTier,
} from '@/lib/fame-tier';

/**
 * Easy in the server's HTML, the stored tier straight after hydration: the
 * picker keeps its place instead of appearing late. A round started while
 * hydrating reads `currentFameTier()` itself rather than this value.
 */
export function useFameTier() {
  const fameTier = useSyncExternalStore(
    subscribeFameTier,
    currentFameTier,
    () => FameTier.Easy,
  );
  const setFameTier = useCallback((tier: FameTier) => saveFameTier(tier), []);

  return { fameTier, setFameTier };
}
