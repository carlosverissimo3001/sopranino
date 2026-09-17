'use client';

import { MailCheck } from 'lucide-react';
import { useResendVerification } from '@/hooks/auth/useResendVerification';

interface CheckYourEmailProps {
  email: string;
  onLater: () => void;
}

export function CheckYourEmail({ email, onLater }: CheckYourEmailProps) {
  const { resend, sent, pending, secondsLeft } = useResendVerification();

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-spotify-green/15 text-spotify-green">
        <MailCheck className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-fg">
          Verify your email
        </h1>
        <p className="text-sm text-fg/60">
          We sent a link to{' '}
          <span className="font-semibold text-fg">{email}</span>.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={resend}
          disabled={pending || secondsLeft > 0}
          className="h-11 w-full cursor-pointer rounded-full border border-fg/15 text-sm font-semibold text-fg transition-colors hover:bg-fg/5 disabled:cursor-default disabled:opacity-50"
        >
          {secondsLeft > 0
            ? `Resend in ${secondsLeft}s`
            : pending
              ? 'Sending…'
              : 'Resend link'}
        </button>
        <button
          type="button"
          onClick={onLater}
          className="h-11 w-full cursor-pointer rounded-full text-sm font-semibold text-fg/50 transition-colors hover:text-fg"
        >
          Verify later
        </button>
      </div>

      {sent && (
        <p role="status" className="text-xs text-fg/40">
          Sent again. Check your spam folder too.
        </p>
      )}
    </div>
  );
}
