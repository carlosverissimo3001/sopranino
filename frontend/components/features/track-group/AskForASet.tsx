'use client';

import { useState, type FormEvent } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { useSubmitFeedback } from '@/hooks/feedback/useSubmitFeedback';
import { originPath } from '@/lib/report-origin';
import { CreateFeedbackControllerDtoKindEnum as Kind } from '@/sdk';

/** Matches FEEDBACK_REQUEST_MAX; the server refuses anything longer. */
const NAME_MAX = 80;
const NAME_MIN = 3;
const THANKS = 'Got it, thanks for asking.';

interface AskForASetProps {
  /** A line under a list of chips, or the last card of a grid. */
  variant?: 'line' | 'tile';
}

/**
 * The moment someone wants an artist is the moment they look for one and it is
 * not there, so the ask sits after the sets rather than on the report form.
 */
export function AskForASet({ variant = 'line' }: AskForASetProps) {
  const submit = useSubmitFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  const trimmed = name.trim();
  const canSend = trimmed.length >= NAME_MIN && !submit.isPending;
  const isTile = variant === 'tile';

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    submit.mutate({
      kind: Kind.ArtistRequest,
      message: trimmed,
      pagePath: originPath(window.location.pathname),
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
      website: website || undefined,
    });
  };

  const form = (
    <form
      onSubmit={send}
      className={
        isTile
          ? 'flex w-full flex-col gap-2'
          : // Wraps rather than scrolls: at 375px the field and button may not share a row.
            'mt-3 flex flex-wrap items-center gap-2'
      }
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Artist name</span>
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
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-spotify-green px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-fg/30"
      >
        {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Ask
      </button>

      {submit.isError && (
        <p className="w-full text-xs text-red-400">{submit.error.message}</p>
      )}
    </form>
  );

  const thanks = (
    <p
      className={`flex items-center gap-1.5 text-xs text-fg/50 ${isTile ? 'justify-center text-center' : 'mt-3'}`}
    >
      <Check className="h-3.5 w-3.5 shrink-0 text-spotify-green" />
      {THANKS}
    </p>
  );

  if (!isTile) {
    if (submit.isSuccess) return thanks;
    if (isOpen) return form;
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

  // Built like TrackGroupCard, square and caption, so it lines up with the row.
  const square = submit.isSuccess ? (
    thanks
  ) : isOpen ? (
    form
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-fg/5 text-fg/40 transition-colors group-hover:bg-spotify-green/15 group-hover:text-spotify-green">
      <Plus className="h-6 w-6" />
    </span>
  );

  const body = (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-fg/10 p-3 sm:mb-5 sm:rounded-xl">
        {square}
      </div>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <h3 className="line-clamp-1 text-sm font-black leading-tight text-fg/60 transition-colors group-hover:text-fg sm:text-xl">
          Missing an artist?
        </h3>
        <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-fg/30 sm:text-[10px] sm:tracking-[0.15em]">
          Tell us who
        </p>
      </div>
    </div>
  );

  const shell =
    'group mx-auto h-full w-full max-w-[400px] rounded-xl border border-fg/5 p-3 sm:rounded-2xl sm:p-5 md:h-auto';

  return isOpen || submit.isSuccess ? (
    <div className={shell}>{body}</div>
  ) : (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className={`${shell} cursor-pointer transition-colors hover:bg-fg/[0.04]`}
    >
      {body}
    </button>
  );
}
