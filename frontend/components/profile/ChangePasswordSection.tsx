'use client';

import { FormEvent, useState } from 'react';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { MIN_PASSWORD_LENGTH } from '@/lib/consts';

const FIELD =
  'w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors';

/**
 * For someone who still knows their password. The one who does not is locked
 * out and cannot be on this page at all — that is what /reset is for.
 */
export function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const change = useChangePassword();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
        },
      },
    );
  }

  // No icon and no heading of its own: this sits under the address in that
  // row's column, because the address is what it belongs to.
  return (
    <div>
      {change.isSuccess ? (
        <p className="text-xs leading-relaxed text-fg/60">
          Changed. Any other browser signed in as you has been signed out.
        </p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer text-xs text-fg/50 underline underline-offset-4 hover:text-fg/80"
        >
          Change your password
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2.5 flex flex-col gap-2.5">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            aria-label="Current password"
            autoComplete="current-password"
            required
            className={FIELD}
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="New password"
            aria-label="New password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className={FIELD}
          />
          <p className="px-1 text-[11px] text-fg/40">
            At least {MIN_PASSWORD_LENGTH} characters. Changing it signs you out
            of every other browser.
          </p>

          {change.isError && (
            <p role="alert" className="px-1 text-xs text-red-400">
              {change.error.message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={
                change.isPending ||
                !current ||
                next.length < MIN_PASSWORD_LENGTH
              }
              className="cursor-pointer rounded-full bg-spotify-green px-5 py-2 text-xs font-black text-black transition-opacity disabled:cursor-default disabled:opacity-50"
            >
              {change.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer text-[11px] text-fg/40 underline underline-offset-4 hover:text-fg/70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
