'use client';

import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';

type EditableNameProps = {
  /** Sits before the name, "Playing as". Left out where the context says it. */
  prefix?: string;
  className?: string;
};

/**
 * The name, and the control for changing it, wherever the name is already on
 * screen. A guest who has not chosen one gets the word "Change" as well: a
 * pencil sat on the reveal card for weeks and people kept their generated name.
 */
export function EditableName({ prefix, className }: EditableNameProps) {
  const { data: user } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Escape unmounts the input, which blurs it; the blur must not save.
  const cancelled = useRef(false);

  if (!user) {
    return null;
  }

  const chosen = user.hasAccount;

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

  if (editing) {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-2 ${className ?? ''}`}
      >
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          // After the focus settles, or the browser drops the selection again.
          onFocus={(event) => {
            const input = event.target;
            requestAnimationFrame(() => input.select());
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
            if (event.key === 'Escape') {
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
        <span className="hidden text-[11px] text-fg/30 sm:inline">
          Enter to save
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(user.displayName);
        setEditing(true);
      }}
      aria-label={`Change your name, currently ${user.displayName}`}
      className={`group inline-flex min-w-0 items-center gap-1.5 ${className ?? ''}`}
    >
      {prefix && <span className="shrink-0 text-fg/50">{prefix}</span>}
      <span className="truncate font-bold text-fg underline decoration-fg/25 decoration-dotted underline-offset-4 group-hover:decoration-spotify-green">
        {user.displayName}
      </span>
      {chosen ? (
        <Pencil className="h-3 w-3 shrink-0 text-fg/40 group-hover:text-spotify-green" />
      ) : (
        <span className="shrink-0 text-fg/40 group-hover:text-spotify-green">
          · Change
        </span>
      )}
    </button>
  );
}
