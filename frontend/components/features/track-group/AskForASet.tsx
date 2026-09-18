'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { useSubmitFeedback } from '@/hooks/feedback/useSubmitFeedback';
import { originPath } from '@/lib/report-origin';
import { CreateFeedbackControllerDtoKindEnum as Kind } from '@/sdk';

/** Matches FEEDBACK_REQUEST_MAX; the server refuses anything longer. */
const NAME_MAX = 80;
const NAME_MIN = 3;
const THANKS = 'Got it, thanks for asking.';

export function AskForASet() {
  const submit = useSubmitFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const reopenFocus = useRef(false);

  const close = () => {
    setIsOpen(false);
    setName('');
    reopenFocus.current = true;
  };

  const trimmed = name.trim();
  const canSend = trimmed.length >= NAME_MIN && !submit.isPending;

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
    <form onSubmit={send} className="flex flex-wrap items-center gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Artist name</span>
        {/* Beats the global 16px input rule. */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            // The picker around it listens on document, which is also React's root.
            e.nativeEvent.stopImmediatePropagation();
            close();
          }}
          maxLength={NAME_MAX}
          autoFocus
          placeholder="Which artist?"
          className="block w-full min-w-0 rounded-full border border-fg/10 bg-fg/5 px-3 py-1.5 !text-[10px] text-fg placeholder:text-fg/30 focus:border-spotify-green/40 focus:outline-none"
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

      <button
        type="button"
        onClick={close}
        aria-label="Cancel"
        className="shrink-0 rounded-full p-1 text-fg/30 transition-colors hover:text-fg/70"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {submit.isError && (
        <p className="w-full text-xs text-red-400">{submit.error.message}</p>
      )}
    </form>
  );

  const thanks = (
    <p className="flex items-center gap-1.5 text-xs text-fg/50">
      <Check className="h-3.5 w-3.5 shrink-0 text-spotify-green" />
      {THANKS}
    </p>
  );

  if (submit.isSuccess) return thanks;
  if (isOpen) return form;
  return (
    <button
      ref={(el) => {
        if (el && reopenFocus.current) {
          reopenFocus.current = false;
          el.focus();
        }
      }}
      type="button"
      onClick={() => setIsOpen(true)}
      // A line of 10px text is not a tap target; the padding is the target.
      className="-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs text-fg/40 transition-colors hover:text-fg/70"
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      Missing an artist? Tell us
    </button>
  );
}
