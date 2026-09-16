'use client';

import { useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { useSubmitFeedback } from '@/hooks/feedback/useSubmitFeedback';
import { originPath } from '@/lib/report-origin';
import { CreateFeedbackControllerDtoKindEnum as Kind } from '@/sdk';

/** Matches FEEDBACK_REQUEST_MAX; the server refuses anything longer. */
const NAME_MAX = 80;
const NAME_MIN = 3;

/**
 * The moment someone wants an artist is the moment they look for one and it is
 * not there, so the ask sits under the sets rather than on the report form.
 */
export function AskForASet() {
  const submit = useSubmitFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  const trimmed = name.trim();
  const canSend = trimmed.length >= NAME_MIN && !submit.isPending;

  if (submit.isSuccess) {
    return (
      <p className="flex items-center gap-1.5 pt-3 text-xs text-fg/50">
        <Check className="h-3.5 w-3.5 shrink-0 text-spotify-green" />
        Asked. Enough of these and it gets made.
      </p>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg/40 transition-colors hover:text-fg/70"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
        Missing an artist? Tell us
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSend) return;
        submit.mutate({
          kind: Kind.ArtistRequest,
          message: trimmed,
          pagePath: originPath(window.location.pathname),
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
          website: website || undefined,
        });
      }}
      // Wraps rather than scrolls: at 375px the field and button do not share a row.
      className="mt-3 flex flex-wrap items-center gap-2"
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Artist or set name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          autoFocus
          placeholder="Which artist?"
          className="block w-full min-w-0 rounded-full border border-fg/10 bg-fg/5 px-3 py-1.5 text-xs text-fg placeholder:text-fg/30 focus:border-spotify-green/40 focus:outline-none"
        />
      </label>

      {/* Hidden and oddly named: autofill must never fill it, or the ask is dropped. */}
      <input
        type="text"
        name="hp_field"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
        className="hidden"
      />

      <button
        type="submit"
        disabled={!canSend}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-spotify-green px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-fg/30"
      >
        {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Ask
      </button>

      {submit.isError && (
        <p className="w-full text-xs text-red-400">{submit.error.message}</p>
      )}
    </form>
  );
}
