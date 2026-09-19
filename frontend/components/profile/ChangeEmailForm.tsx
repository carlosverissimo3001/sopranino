'use client';

import { FormEvent, useState } from 'react';
import { useRequestEmailChange } from '@/hooks/auth/useEmailChange';
import { CANCEL, FIELD, SUBMIT } from './account-styles';

export function ChangeEmailForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const request = useRequestEmailChange();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    request.mutate(
      { newEmail: newEmail.trim(), currentPassword: password },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <input
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="New email"
        aria-label="New email"
        autoComplete="email"
        required
        className={FIELD}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Current password"
        aria-label="Current password"
        autoComplete="current-password"
        required
        className={FIELD}
      />
      <p className="px-1 text-[11px] leading-relaxed text-fg/40">
        We send a link to the new address. Your current one stays on the
        account, and keeps working, until you click it.
      </p>

      {request.isError && (
        <p role="alert" className="px-1 text-xs text-red-400">
          {request.error.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={request.isPending || !newEmail.trim() || !password}
          className={SUBMIT}
        >
          {request.isPending ? 'Sending…' : 'Send the link'}
        </button>
        <button type="button" onClick={onCancel} className={CANCEL}>
          Cancel
        </button>
      </div>
    </form>
  );
}
