'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useSubmitFeedback } from '@/hooks/feedback/useSubmitFeedback';
import { originPath } from '@/lib/report-origin';
import { CreateFeedbackControllerDtoKindEnum as Kind } from '@/sdk';

const MESSAGE_MIN = 3;
const MESSAGE_MAX = 2000;

const KINDS = [
  { value: Kind.Bug, label: 'Something is broken' },
  { value: Kind.Suggestion, label: 'An idea' },
] as const;

export function FeedbackForm() {
  const { data: me } = useMe();
  const submit = useSubmitFeedback();

  const [kind, setKind] = useState<Kind>(Kind.Bug);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [website, setWebsite] = useState('');

  // Prefilled from the account until the player types their own.
  const emailValue = email ?? me?.email ?? '';
  const trimmed = message.trim();
  const canSend = trimmed.length >= MESSAGE_MIN && !submit.isPending;

  if (submit.isSuccess) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-spotify-green/30 bg-spotify-green/10 p-4 text-sm text-fg">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-spotify-green" />
        <div>
          <p className="font-semibold">Sent. Thank you.</p>
          <p className="mt-1 text-fg/60">
            {emailValue
              ? 'If it needs a reply, it will come to that address.'
              : 'It will be read, even without a way to reply.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSend) return;
        submit.mutate({
          kind,
          message: trimmed,
          email: emailValue.trim() || undefined,
          // On send: useSearchParams would opt the page out of static rendering.
          pagePath: originPath(
            new URLSearchParams(window.location.search).get('from'),
          ),
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
          website: website || undefined,
        });
      }}
      className="space-y-3"
    >
      <div
        role="radiogroup"
        aria-label="What is it about"
        className="inline-flex gap-1 rounded-full border border-fg/10 bg-fg/5 p-1"
      >
        {KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={kind === option.value}
            onClick={() => setKind(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              kind === option.value
                ? 'bg-fg/[0.14] text-fg shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-fg/45 hover:text-fg/75'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MESSAGE_MAX}
          rows={4}
          required
          placeholder={
            kind === Kind.Bug
              ? 'What happened, and what did you expect?'
              : 'What would make the game better?'
          }
          className="block w-full resize-y rounded-xl border border-fg/10 bg-fg/5 px-4 py-3 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/40 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="sr-only">Email, optional</span>
        <input
          type="email"
          value={emailValue}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email, if you would like a reply"
          autoComplete="email"
          className="block w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/40 focus:outline-none"
        />
      </label>

      {/* Hidden and oddly named: autofill must never fill it, or the report is dropped. */}
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg/40">
          Sent with the page you came from, your browser and the app version.
        </p>
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-spotify-green px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-fg/30"
        >
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send
        </button>
      </div>

      {submit.isError && (
        <p className="text-sm text-red-400">
          {submit.error.message ||
            'Could not send that. Try again in a minute.'}
        </p>
      )}
    </form>
  );
}
