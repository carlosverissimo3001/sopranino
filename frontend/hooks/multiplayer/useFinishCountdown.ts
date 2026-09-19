'use client';

import { useEffect, useState } from 'react';

const secondsUntil = (deadline?: Date) =>
  deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000))
    : 0;

/**
 * Seconds left on the room's clock, which starts when the first player plays
 * the room out. Null while nobody has, so a room with time to spare says
 * nothing. The deadline is the server's; this only counts it down.
 */
export function useFinishCountdown(deadline?: Date): number | null {
  const [left, setLeft] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    if (!deadline) return;
    setLeft(secondsUntil(deadline));
    const timer = setInterval(() => setLeft(secondsUntil(deadline)), 500);
    return () => clearInterval(timer);
  }, [deadline]);

  return deadline ? left : null;
}
