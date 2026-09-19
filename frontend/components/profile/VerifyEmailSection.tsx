'use client';

import { ReactNode } from 'react';
import { MailCheck, MailWarning } from 'lucide-react';
import { useResendVerification } from '@/hooks/auth/useResendVerification';
import type { AuthMeResponseDto } from '@/sdk';

/**
 * The permanent home for verification. The banner on the home page can be
 * dismissed, so without this the only way back to it would be to remember it
 * existed and reload.
 */
export function VerifyEmailSection({
  user,
  children,
}: {
  user: AuthMeResponseDto;
  children?: ReactNode;
}) {
  const { resend, sent, pending, secondsLeft } = useResendVerification();
  const verified = user.emailVerified;

  return (
    <div className="flex items-start gap-3 py-4">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          verified
            ? 'bg-spotify-green/15 text-spotify-green'
            : 'bg-amber-500/15 text-amber-300'
        }`}
      >
        {verified ? (
          <MailCheck className="h-4 w-4" />
        ) : (
          <MailWarning className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-tight text-fg">{user.email}</p>
        {/* A confirmed address needs no explaining; the icon says it. */}
        {!verified && (
          <p className="mt-0.5 text-xs leading-relaxed text-fg/60">
            {sent
              ? 'Link sent. Check your spam folder if it does not turn up.'
              : 'Not confirmed yet, so this address cannot reset your password.'}
          </p>
        )}

        {!verified && (
          <button
            type="button"
            onClick={resend}
            disabled={pending || secondsLeft > 0}
            className="mt-2 cursor-pointer rounded-full border border-amber-400/30 px-4 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-400/10 disabled:cursor-default disabled:opacity-50"
          >
            {secondsLeft > 0
              ? `Resend in ${secondsLeft}s`
              : pending
                ? 'Sending…'
                : sent
                  ? 'Send again'
                  : 'Send the link'}
          </button>
        )}
        {/* Same offset the unverified line uses, so both states of this row
            keep one rhythm under the address. */}
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
