'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useConfirmEmail } from '@/hooks/auth/useConfirmEmail';

export function VerifyClient() {
  const token = useSearchParams().get('token');
  const confirm = useConfirmEmail();
  const { mutate } = confirm;

  // A link is spendable once, so Strict Mode's second render must not spend it.
  const attempted = useRef(false);
  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    mutate(token);
  }, [token, mutate]);

  const failed =
    !token || confirm.isError || (confirm.isSuccess && !confirm.data.verified);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      {confirm.isPending && (
        <p className="text-sm text-fg/50">Confirming your address…</p>
      )}

      {confirm.isSuccess && confirm.data.verified && (
        <>
          <h1 className="text-3xl font-black tracking-tight text-fg">
            Address confirmed
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-fg/50">
            You can reset your password from now on, so a forgotten one is no
            longer the end of your streak.
          </p>
        </>
      )}

      {failed && !confirm.isPending && (
        <>
          <h1 className="text-3xl font-black tracking-tight text-fg">
            That link is no longer good
          </h1>
          {/* One message for expired, already used and made up alike: they
              amount to the same thing for whoever is holding the link. */}
          <p className="max-w-sm text-sm leading-relaxed text-fg/50">
            It may have been used already, or it may have expired. Sign in and
            ask for a new one.
          </p>
        </>
      )}

      {!confirm.isPending && (
        <Link href="/">
          <Button variant="spotify" className="!rounded-full px-8">
            Back to sopranino
          </Button>
        </Link>
      )}
    </div>
  );
}
