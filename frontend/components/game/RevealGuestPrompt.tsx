'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hooks/auth/useMe';
import {
  readAskedUserId,
  signUpSnoozed,
  snoozeSignUp,
} from '@/lib/guest-prompts';
import { ClaimNamePrompt } from './ClaimNamePrompt';

/**
 * One ask at a time under a guest's reveal: the free one first, then the
 * account. Asking for both at the moment they just played reads as a wall.
 */
export function RevealGuestPrompt() {
  const { data: user } = useMe();
  // Read per render: `user` lands a render after this mounts, so storage
  // cannot be initial state. `settled` only forces the re-read.
  const [settled, setSettled] = useState(0);

  if (!user || user.hasAccount) {
    return null;
  }

  const named = readAskedUserId() === user.userId;
  if (!named || signUpSnoozed()) {
    return <ClaimNamePrompt onSettled={() => setSettled(settled + 1)} />;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:justify-start">
      <span className="text-fg/50">Play songs from your own playlists.</span>
      <Link
        href="/signin?mode=signup"
        className="font-bold text-spotify-green underline decoration-spotify-green/30 underline-offset-4 hover:decoration-spotify-green"
      >
        Create an account
      </Link>
      <button
        type="button"
        onClick={() => {
          snoozeSignUp();
          setSettled(settled + 1);
        }}
        className="text-fg/35 transition-colors hover:text-fg/60"
      >
        Not now
      </button>
    </div>
  );
}
