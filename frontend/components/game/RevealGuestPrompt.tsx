'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hooks/auth/useMe';
import { signUpSnoozed, snoozeSignUp } from '@/lib/guest-prompts';

/**
 * What an account adds, in the reveal's footer. Only this: a guest's name and
 * its pencil pulled the eye off the offer, and the profile page still
 * holds the rename.
 */
export function RevealGuestPrompt() {
  const { data: user } = useMe();
  // Storage is read per render: `user` lands a render after this mounts, so it
  // cannot be initial state. The counter only forces the re-read.
  const [snoozed, setSnoozed] = useState(0);

  if (!user || user.hasAccount || signUpSnoozed()) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-fg/10 px-5 py-3 text-xs sm:justify-start sm:px-6">
      <span className="text-fg/60">Play songs from your own playlists.</span>
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
    </div>
  );
}
