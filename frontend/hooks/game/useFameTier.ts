'use client';

import { useCallback, useState } from 'react';
import type { FameTier } from '@/sdk';
import { readFameTier, saveFameTier } from '@/lib/fame-tier';

/** Read on first render, not after mount: the round starts from it straight away. */
export function useFameTier() {
  const [fameTier, setFameTierState] = useState<FameTier>(readFameTier);

  const setFameTier = useCallback((tier: FameTier) => {
    setFameTierState(tier);
    saveFameTier(tier);
  }, []);

  return { fameTier, setFameTier };
}
