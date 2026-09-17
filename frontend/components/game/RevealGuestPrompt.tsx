'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hooks/auth/useMe';
import { signUpSnoozed, snoozeSignUp } from '@/lib/guest-prompts';
import { ClaimNamePrompt } from './ClaimNamePrompt';

export function RevealGuestPrompt() {
  const { data: user } = useMe();
  // Storage is read per render: `user` lands a render after this mounts, so it
  // cannot be initial state. The counter only forces the re-read.
  const [snoozed, setSnoozed] = useState(0);

  if (!user || user.hasAccount) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:justify-start">
      <ClaimNamePrompt />
      {!signUpSnoozed() && (
        <>
          <span className="text-fg/50">
            Play songs from your own playlists.
          </span>
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
              setSnoozed(snoozed + 1);
            }}
            className="text-fg/35 transition-colors hover:text-fg/60"
          >
            Not now
          </button>
        </>
      )}
    </div>
  );
}
