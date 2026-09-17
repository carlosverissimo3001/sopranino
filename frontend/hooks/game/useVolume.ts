'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_VOLUME } from '@/consts/consts';

const STORAGE_KEY = 'unpaused:volume';
const CHANGE_EVENT = 'unpaused:volume-change';

// Where the volume lives when the browser refuses storage.
let unstored: number | null = null;

function read(): number {
  if (unstored !== null) return unstored;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return DEFAULT_VOLUME;
    const parsed = Number(stored);
    return isNaN(parsed) || parsed < 0 || parsed > 1 ? DEFAULT_VOLUME : parsed;
  } catch {
    return DEFAULT_VOLUME;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * The server cannot see the stored volume, so it and the first client render
 * both use the default; the stored value follows without a hydration mismatch.
 */
export function useVolume() {
  const volume = useSyncExternalStore(subscribe, read, () => DEFAULT_VOLUME);

  const updateVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      unstored = clamped;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { volume, setVolume: updateVolume };
}
