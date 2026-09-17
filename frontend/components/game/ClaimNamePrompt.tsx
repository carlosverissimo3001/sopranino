'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';

/**
 * A guest's name and the control for changing it: the pencil says so without a
 * sentence explaining it. Enter saves, Escape leaves it.
 */
export function ClaimNamePrompt() {
  const { data: user } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Escape unmounts the input, which blurs it; the blur must not save.
  const cancelled = useRef(false);

  // Someone with an account already has a name they chose.
  if (!user || user.hasAccount) {
    return null;
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
    updateProfile(trimmed, { onSuccess: () => setEditing(false) });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
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
      {editing && (
        <span className="text-fg/30">Enter to save, Esc to cancel</span>
      )}
    </motion.div>
  );
}
