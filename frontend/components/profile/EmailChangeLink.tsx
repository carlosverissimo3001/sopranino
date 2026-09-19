'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSpendEmailChangeLink } from '@/hooks/auth/useEmailChange';

const COPY = {
  confirm: {
    pending: 'Confirming your new address…',
    done: 'Email changed',
    doneBody:
      'This address is now the one on your account, and where a password reset goes.',
    failedBody:
      'It may have been used already, expired, or replaced by a newer one. Ask for a new link from your profile.',
  },
  cancel: {
    pending: 'Cancelling the change…',
    done: 'Change cancelled',
    doneBody:
      'Your email stays as it was. If you did not ask for the change, reset your password too.',
    failedBody:
      'It may have been used already, or the change was confirmed or cancelled since.',
  },
} as const;

export function EmailChangeLink({ kind }: { kind: 'confirm' | 'cancel' }) {
  const token = useSearchParams().get('token');
  const spend = useSpendEmailChangeLink(kind);
  const { mutate } = spend;
  const copy = COPY[kind];

  // A link is spendable once, so Strict Mode's second render must not spend it.
  const attempted = useRef(false);
  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    mutate(token);
  }, [token, mutate]);

  const done = spend.isSuccess && spend.data.done;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      {spend.isPending ? (
        <p className="text-sm text-fg/50">{copy.pending}</p>
      ) : (
        <>
          <h1 className="text-3xl font-black tracking-tight text-fg">
            {done ? copy.done : 'That link is no longer good'}
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-fg/50">
            {done ? copy.doneBody : copy.failedBody}
          </p>
          <Link href={done && kind === 'confirm' ? '/profile' : '/'}>
            <Button variant="spotify" className="!rounded-full px-8">
              {done && kind === 'confirm'
                ? 'Go to your profile'
                : 'Back to sopranino'}
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
