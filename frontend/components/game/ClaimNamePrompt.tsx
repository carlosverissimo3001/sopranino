'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
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
 * a name, no password and no email. The name itself is the control: tap it to
 * edit in place, Enter saves, Escape leaves it. Until they choose or say not
 * now, it carries an invitation; after that it is a quiet line.
 */
export function ClaimNamePrompt() {
  const { data: user } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Asked-or-not is read from storage per render: `user` arrives a render
  // later than this mounts, so it cannot be initial state.
  const [dismissed, setDismissed] = useState(false);
  // Escape unmounts the input, which blurs it; the blur must not save.
  const cancelled = useRef(false);

  // Someone with an account already has a name they chose.
  if (!user || user.hasAccount) {
    return null;
  }

  const quiet = dismissed || readAskedUserId() === user.userId;

  function settle() {
    if (user) writeAskedUserId(user.userId);
    setDismissed(true);
    setEditing(false);
  }

  function save() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed || trimmed === user?.displayName) {
      setEditing(false);
      return;
    }
    updateProfile(trimmed, { onSuccess: settle });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start ${quiet ? 'text-[11px]' : 'text-xs'}`}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-fg/50">
        Playing as
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            // After the focus settles, or the browser drops the selection again.
            onFocus={(e) => {
              const input = e.target;
              requestAnimationFrame(() => input.select());
            }}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') {
                cancelled.current = true;
                setEditing(false);
              }
            }}
            disabled={isPending}
            maxLength={50}
            aria-label="Your name"
            size={Math.max(draft.length, 8)}
            className="min-w-0 border-b border-spotify-green bg-transparent font-bold text-fg outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(user.displayName);
              setEditing(true);
            }}
            aria-label={`Change your name, ${user.displayName}`}
            className="group inline-flex items-center gap-1 font-bold text-fg underline decoration-fg/25 decoration-dotted underline-offset-4 hover:decoration-spotify-green"
          >
            {user.displayName}
            <Pencil className="h-3 w-3 text-fg/40 group-hover:text-spotify-green" />
          </button>
        )}
      </span>
      {editing ? (
        <span className="text-fg/30">Enter to save, Esc to cancel</span>
      ) : (
        !quiet && (
          <>
            <span className="text-fg/40">Tap it to pick your own.</span>
            <button
              type="button"
              onClick={settle}
              className="text-fg/35 transition-colors hover:text-fg/60"
            >
              Not now
            </button>
          </>
        )
      )}
    </motion.div>
  );
}
