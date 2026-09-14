'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CredentialsForm } from '@/components/auth/CredentialsForm';
import { useMe } from '@/hooks/auth/useMe';

/**
 * Somewhere for a guest to sign in from.
 *
 * Once a guest session exists the home page never shows the landing screen
 * again, so somebody who tapped "Play now" with an account already had no way
 * back to it short of clearing a cookie.
 *
 * Signing in from here keeps what the guest played: the login path merges that
 * row into the account, which is why this is an invitation to sign in rather
 * than a way to log out of a session that has nothing behind it.
 */
export function SignInClient({ canSignIn }: { canSignIn: boolean }) {
  const router = useRouter();
  const { data: user } = useMe();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm font-semibold text-fg/60 transition-colors hover:text-fg sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex w-full max-w-xs flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-fg">
            Sign in
          </h1>
          {!user?.hasAccount && (
            <p className="text-sm leading-relaxed text-fg/50">
              Anything you have played on this device comes with you.
            </p>
          )}
        </div>

        <CredentialsForm initialMode="login" onDone={() => router.push('/')} />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-fg/10" />
          <span className="text-[10px] uppercase tracking-widest text-fg/30">
            or
          </span>
          <span className="h-px flex-1 bg-fg/10" />
        </div>

        {/* Shown even when closed, as on the home page: a missing button reads
            as a broken page, a disabled one says why. */}
        <div className="flex flex-col items-center gap-2">
          {canSignIn ? (
            <a href="/api/auth/login" className="block w-full">
              <SpotifyButton />
            </a>
          ) : (
            <SpotifyButton disabled />
          )}
          {!canSignIn && (
            <span className="text-xs text-fg/45">
              Invite-only, by Spotify&apos;s limits
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

function SpotifyButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <Button
      variant="spotify"
      disabled={disabled}
      className="!h-11 w-full !rounded-full text-sm font-black"
    >
      <Image
        src="/spotify-icon.svg"
        alt=""
        width={16}
        height={16}
        className="mr-2.5 shrink-0"
      />
      Continue with Spotify
    </Button>
  );
}
