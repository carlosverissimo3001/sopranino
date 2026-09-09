'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useConfirmPasswordReset } from '@/hooks/auth/usePasswordReset';
import { MIN_PASSWORD_LENGTH } from '@/lib/consts';

const FIELD =
  'w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors';

export function ResetClient() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const confirm = useConfirmPasswordReset();

  const done = confirm.isSuccess && confirm.data.reset;
  const dead =
    !token || confirm.isError || (confirm.isSuccess && !confirm.data.reset);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (token) confirm.mutate([token, password]);
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      {done ? (
        <>
          <h1 className="text-3xl font-black tracking-tight text-fg">
            Password changed
          </h1>
          {/* Says it plainly: a reset ends every session, and someone whose
              account was taken needs to know the other one is gone. */}
          <p className="max-w-sm text-sm leading-relaxed text-fg/50">
            You have been signed out everywhere else. Sign in with the new
            password to pick up where you left off.
          </p>
        </>
      ) : dead ? (
        <>
          <h1 className="text-3xl font-black tracking-tight text-fg">
            That link is no longer good
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-fg/50">
            It may have been used already, or it may have expired. Ask for a new
            one from the sign in form.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-black tracking-tight text-fg">
            Choose a new password
          </h1>
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-xs flex-col gap-3"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              aria-label="New password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              autoFocus
              required
              className={FIELD}
            />
            <p className="px-1 text-[11px] text-fg/40">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
            <Button
              type="submit"
              variant="spotify"
              disabled={
                confirm.isPending || password.length < MIN_PASSWORD_LENGTH
              }
              className="!h-11 !rounded-full text-sm font-black"
            >
              {confirm.isPending ? 'Saving…' : 'Set new password'}
            </Button>
          </form>
        </>
      )}

      {!confirm.isPending && (
        <Link href="/">
          <Button variant="outline" className="!rounded-full px-8">
            Back to sopranino
          </Button>
        </Link>
      )}
    </div>
  );
}
