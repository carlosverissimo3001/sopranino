'use client';

import { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { useResendVerification } from '@/hooks/auth/useResendVerification';
import {
  useCancelEmailChange,
  useResendEmailChange,
} from '@/hooks/auth/useEmailChange';
import type { AuthMeResponseDto } from '@/sdk';
import { ACTION, ACTION_WARN } from './account-styles';
import { ChangeEmailForm } from './ChangeEmailForm';
import { ChangePasswordForm } from './ChangePasswordForm';

type Panel = 'email' | 'password' | null;

/**
 * The address, whether it is proved, and everything done to it. The home
 * banner about verifying can be dismissed; this is where it lives for good.
 */
export function EmailRow({ user }: { user: AuthMeResponseDto }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState<string | null>(null);
  const verification = useResendVerification();
  const verified = user.emailVerified;

  const toggle = (next: Exclude<Panel, null>) => {
    setNote(null);
    setPanel(panel === next ? null : next);
  };

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fg/5 text-fg/50">
        <Mail className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 truncate text-sm font-bold text-fg">
            {user.email}
          </p>
          {verified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-spotify-green">
              <Check className="h-3 w-3" />
              Confirmed
            </span>
          ) : (
            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              Not confirmed
            </span>
          )}
        </div>

        {!verified && (
          <p className="mt-1 text-xs leading-relaxed text-fg/50">
            {verification.sent
              ? 'Link sent. Check your spam folder if it does not turn up.'
              : 'Confirm it so it can reset your password.'}{' '}
            <button
              type="button"
              onClick={verification.resend}
              disabled={verification.pending || verification.secondsLeft > 0}
              className={ACTION_WARN}
            >
              {verification.secondsLeft > 0
                ? `Send again in ${verification.secondsLeft}s`
                : verification.pending
                  ? 'Sending…'
                  : verification.sent
                    ? 'Send again'
                    : 'Send link'}
            </button>
          </p>
        )}

        {user.pendingEmail && <PendingChange email={user.pendingEmail} />}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {!user.pendingEmail && (
            <button
              type="button"
              aria-expanded={panel === 'email'}
              onClick={() => toggle('email')}
              className={ACTION}
            >
              Change email
            </button>
          )}
          <button
            type="button"
            aria-expanded={panel === 'password'}
            onClick={() => toggle('password')}
            className={ACTION}
          >
            Change password
          </button>
        </div>

        {note && <p className="mt-2 text-xs text-fg/60">{note}</p>}

        {panel && (
          <div className="mt-3">
            {panel === 'email' ? (
              <ChangeEmailForm
                onDone={() => setPanel(null)}
                onCancel={() => setPanel(null)}
              />
            ) : (
              <ChangePasswordForm
                onDone={() => {
                  setPanel(null);
                  setNote(
                    'Password changed. Any other browser signed in as you has been signed out.',
                  );
                }}
                onCancel={() => setPanel(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingChange({ email }: { email: string }) {
  const resend = useResendEmailChange();
  const cancel = useCancelEmailChange();

  return (
    <div className="mt-2.5 rounded-xl border border-fg/10 bg-fg/[0.03] px-3.5 py-3">
      <p className="text-xs leading-relaxed text-fg/60">
        Changing to <span className="font-bold text-fg">{email}</span>. Click
        the link we sent there to finish; until then, nothing changes.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={resend.resend}
          disabled={resend.pending || resend.secondsLeft > 0}
          className={ACTION}
        >
          {resend.secondsLeft > 0
            ? `Send again in ${resend.secondsLeft}s`
            : resend.pending
              ? 'Sending…'
              : 'Send again'}
        </button>
        <button
          type="button"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
          className={ACTION}
        >
          Cancel the change
        </button>
      </div>
    </div>
  );
}
