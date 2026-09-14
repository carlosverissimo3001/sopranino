'use client';

import { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useEnsureSession } from '@/hooks/auth/useEnsureSession';
import { CredentialsForm } from '@/components/auth/CredentialsForm';
import { InviteForm } from '@/components/auth/InviteForm';
import { forgetSignedIn, readSignedInAs } from '@/lib/returning-player';

/**
 * Kept as a real button, not a quiet link: the handful of whitelisted users
 * come here specifically to play their own library, and should not have to
 * hunt for it — or worse, land in guest mode by mistake.
 */
function SpotifyButton({ canSignIn }: { canSignIn: boolean }) {
  const inner = (
    <Button
      variant="outline"
      disabled={!canSignIn}
      className="!h-12 sm:!h-14 !rounded-full text-base font-semibold w-full"
    >
      <Image
        src="/spotify-icon.svg"
        alt=""
        width={18}
        height={18}
        // The icon ships dark, which disappears against the page.
        className="mr-2.5 shrink-0 brightness-0 invert"
      />
      Sign in with Spotify
    </Button>
  );

  return canSignIn ? (
    <a href="/api/auth/login" className="w-full">
      {inner}
    </a>
  ) : (
    <div className="w-full">{inner}</div>
  );
}

function UnauthenticatedViewComponent({ canSignIn }: { canSignIn: boolean }) {
  const [showInvite, setShowInvite] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  /**
   * Read after mount, never during render: the server has no localStorage and
   * a mismatch here would flash the wrong door.
   */
  const [returningAs, setReturningAs] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setReturningAs(readSignedInAs());
  }, []);
  // useMe's cache is updated by the mutation, so the home page re-renders
  // into the signed-in shell without a navigation.
  const ensureSession = useEnsureSession();

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[80vh] overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center flex flex-col gap-8 sm:gap-12 max-w-2xl px-6"
      >
        <div className="flex flex-col gap-4 sm:gap-6">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-fg leading-[0.9]">
            Song guessing,
            <br />
            <span className="text-spotify-green drop-shadow-[0_0_40px_rgba(30,215,96,0.35)]">
              reimagined.
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-fg/50 max-w-[280px] sm:max-w-md mx-auto leading-relaxed font-medium">
            Hear a snippet. Name the song. Six tries.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Signing back in is the whole point of the visit for someone who
              has an account, and both buttons below make a new person. */}
          {returningAs && (
            <div className="w-full max-w-xs flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-fg/50">Welcome back</p>
                <p className="text-sm font-semibold text-fg/80">
                  {returningAs}
                </p>
              </div>
              <CredentialsForm lockedEmail={returningAs} />

              {/* One door for every exception, rather than five on screen at
                  once. Forgetting the address is what reveals them: the full
                  first-time layout is already the answer to "more ways in". */}
              <button
                type="button"
                onClick={() => {
                  forgetSignedIn();
                  setReturningAs(null);
                }}
                className="cursor-pointer text-[11px] text-fg/35 underline underline-offset-4 hover:text-fg/60"
              >
                Not you? More ways in
              </button>
            </div>
          )}

          {/* Equal columns, each caption owned by its own button, so the two
              paths read as a deliberate choice rather than a primary and a
              stray. The caption is what stops a whitelisted user landing in
              guest mode by mistake. */}
          <div
            className={`grid gap-3 sm:gap-4 w-full max-w-md ${
              returningAs ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {!returningAs && (
              <div className="flex flex-col items-center gap-2">
                <div className="relative group w-full">
                  <div className="absolute -inset-1 bg-spotify-green/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                  <Button
                    variant="spotify"
                    onClick={() => ensureSession.mutate()}
                    disabled={ensureSession.isPending}
                    className="relative !h-12 sm:!h-14 w-full !rounded-full text-base font-bold transition-all duration-500 shadow-xl"
                  >
                    {ensureSession.isPending ? 'Starting…' : 'Play now'}
                  </Button>
                </div>
                <span className="text-xs text-fg/45">No sign-in needed</span>
              </div>
            )}

            {/* Kept in view for a returning player: the people holding the site
                password are the ones on the Spotify dashboard, so this is the
                habit rather than the exception for them. */}
            {(!returningAs || canSignIn) && (
              <div className="flex flex-col items-center gap-2">
                <SpotifyButton canSignIn={canSignIn} />
                <span className="text-xs text-fg/45">
                  {canSignIn
                    ? 'Play your own library'
                    : "Invite-only, by Spotify's limits"}
                </span>
              </div>
            )}
          </div>

          {/* Without this an account made on another device has no way back in
              from here: both buttons above start something new. */}
          {returningAs ? null : showSignIn ? (
            <div className="w-full max-w-xs">
              <CredentialsForm initialMode="login" warnAboutSpotify />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignIn(true)}
              className="cursor-pointer text-xs text-fg/40 underline underline-offset-4 hover:text-fg/60 transition-colors"
            >
              Already have an account? Sign in
            </button>
          )}

          {!returningAs &&
            !canSignIn &&
            (showInvite ? (
              <InviteForm />
            ) : (
              // Not an easter egg: for someone whose cookies have expired this
              // is the only way back to the account they already have.
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="cursor-pointer rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg/70 transition-colors hover:border-fg/30 hover:bg-fg/5 hover:text-fg"
              >
                Played here before? Enter your secret word
              </button>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

export const UnauthenticatedView = memo(UnauthenticatedViewComponent);
