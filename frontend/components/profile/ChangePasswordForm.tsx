'use client';

import { FormEvent, useState } from 'react';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { MIN_PASSWORD_LENGTH } from '@/lib/consts';
import { CANCEL, FIELD, SUBMIT } from './account-styles';

/**
 * For someone who still knows their password. The one who does not is locked
 * out and cannot be on this page at all: that is what /reset is for.
 */
export function ChangePasswordForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const change = useChangePassword();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    change.mutate({ current, next }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
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
        At least {MIN_PASSWORD_LENGTH} characters. Changing it signs you out of
        every other browser.
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
            change.isPending || !current || next.length < MIN_PASSWORD_LENGTH
          }
          className={SUBMIT}
        >
          {change.isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className={CANCEL}>
          Cancel
        </button>
      </div>
    </form>
  );
}
