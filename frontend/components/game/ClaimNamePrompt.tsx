'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, X } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';

const ASKED_KEY = 'unpaused:name-prompt-asked';

/** Which user we last asked. Per-user, not per-browser: clearing cookies gives
    the same browser a new identity, and a new identity has not been asked. */
function readAskedUserId(): string | null {
  try {
    return localStorage.getItem(ASKED_KEY);
  } catch {
    return null;
  }
}

function writeAskedUserId(userId: string) {
  try {
    localStorage.setItem(ASKED_KEY, userId);
  } catch {
    // A blocked store only costs us the prompt opening again.
  }
}

/**
 * The first conversion ask, and the only one that costs nothing to say yes to:
 * a name, no password and no email. It opens once, after a round rather than
 * before, when there is already something worth putting a name on. Afterwards
 * it stays as a quiet line, so someone who goes looking still finds it.
 */
export function ClaimNamePrompt() {
  const { data: user } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  // Derived, not initial state: `user` arrives a render later than this mounts.
  const [override, setOverride] = useState<'open' | 'closed' | null>(null);
  const [name, setName] = useState('');

  // Someone with an account already has a name they chose.
  if (!user || user.hasAccount) {
    return null;
  }

  const asked = readAskedUserId() === user.userId;
  const expanded = override ? override === 'open' : !asked;

  function close() {
    if (user) writeAskedUserId(user.userId);
    setOverride('closed');
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setOverride('open')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-fg/35 hover:text-fg/70 transition-colors"
      >
        Playing as {user.displayName}
        <Pencil className="w-3 h-3" />
      </button>
    );
  }

  // One line, inside the reveal card: the round is the point, the name is not.
  return (
    <motion.form
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        updateProfile(trimmed, { onSuccess: close });
      }}
    >
      <p className="text-xs text-fg/60">
        Playing as <span className="font-bold text-fg">{user.displayName}</span>
        . Pick a name, no email needed.
      </p>
      <div className="flex min-w-[12rem] flex-1 items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Your name"
          aria-label="Your name"
          className="h-8 min-w-0 flex-1 rounded-lg border border-fg/15 bg-fg/5 px-2.5 text-sm text-fg placeholder:text-fg/30 focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          aria-label="Save name"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-spotify-green text-black transition-all active:scale-95 disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-fg/30 transition-colors hover:text-fg/60"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.form>
  );
}
