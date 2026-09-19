'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMe } from '@/hooks/auth/useMe';
import { consumeAuthReturnUrl, peekAuthReturnUrl } from '@/lib/auth-return';
import { StreakFreezePrompt } from '@/components/streak/StreakFreezePrompt';
import { useAuthError } from '@/hooks/auth/useAuthError';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { AppHeader } from '@/components/features/AppHeader';
import { GameModesGallery } from '@/components/features/GameModesGallery';
import { LandingGame } from '@/components/features/LandingGame';
import { AppFooter } from '@/components/features/AppFooter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTimezoneSync } from '@/hooks/user-preferences/useTimezoneSync';
import { useSpotifyReturnMark } from '@/hooks/auth/useSpotifyReturnMark';
import { UnverifiedEmailBanner } from '@/components/auth/UnverifiedEmailBanner';
import { TrackGroupView } from '@/components/features/track-group/TrackGroupView';
import { YourPlaylists } from '@/components/features/playlists/YourPlaylists';
import { CuratedGroups } from '@/components/features/track-group/CuratedGroups';
import { TrackGroupDtoTypeEnum } from '@/sdk';

export function HomeClient({
  canSignIn,
  hasSession,
}: {
  canSignIn: boolean;
  hasSession: boolean;
}) {
  const { error } = useAuthError();

  const { data: user, isLoading: isLoadingUser } = useMe();

  // The playlist grid is the one thing a Spotify credential buys, so this
  // asks for the library rather than for an account.
  const hasSpotify = !!user?.hasLinkedAccount;

  useTimezoneSync({ enabled: hasSpotify });
  useSpotifyReturnMark(hasSpotify);

  // Detect post-OAuth pending redirect synchronously on mount so we can
  // render a blank overlay instead of a flash of the homepage while
  // useMe resolves and consumeAuthReturnUrl fires below.
  const [hasPendingReturn, setHasPendingReturn] = useState(false);
  useEffect(() => {
    if (peekAuthReturnUrl()) {
      // A useState initialiser would read sessionStorage during hydration and
      // mismatch the server render, reintroducing the flash this prevents.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasPendingReturn(true);
    }
  }, []);

  // Hard navigation: a return url can point at a rewrite the client router
  // cannot resolve locally.
  useEffect(() => {
    if (hasSpotify) {
      const returnUrl = consumeAuthReturnUrl();
      if (returnUrl) {
        window.location.replace(returnUrl);
      }
    }
  }, [hasSpotify]);
  const [streakDismissed, setStreakDismissed] = useState(false);

  // Latched for the visit: the first round mints a session, and the page must
  // not turn into the home grid under a player halfway through it. A cookie
  // for a session that no longer exists lands here too.
  const [isLanding, setIsLanding] = useState(!hasSession);
  // The landing's way to the menu, as its own history entry: a link to "/"
  // from "/" replaces the entry, and Back then skips the round entirely.
  const menuAsked = useSearchParams().has('menu');
  // null is the server saying nobody; undefined is a request that failed.
  const sessionIsGone = hasSession && user === null;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-way latch
    if (sessionIsGone) setIsLanding(true);
  }, [sessionIsGone]);

  // Suppress homepage flash when we know a returnTo redirect is queued.
  // Renders a black full-bleed div until the redirect effect above fires.
  if (hasPendingReturn) {
    return <main aria-hidden="true" className="min-h-screen bg-black" />;
  }

  // Without a session cookie the answer is already known, so the landing
  // renders on the server rather than behind a spinner a crawler would index.
  if (isLanding && !menuAsked) {
    return (
      // The round paints the screen; the copy and footer below it share that
      // ground instead of the home page's gradient.
      <main
        className="min-h-screen text-fg"
        style={{ background: 'rgb(var(--bg))' }}
      >
        <LandingGame canSignIn={canSignIn} />
        <AppFooter />
      </main>
    );
  }

  if (isLoadingUser && hasSession) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-[100vw] flex flex-col relative overflow-x-hidden text-fg">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle 80% 50% at 50% 0%, rgba(30,215,96,0.1), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <AppHeader user={user} />

      <div className="flex-1 px-4 sm:px-6 py-2 sm:py-8 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:gap-6">
          <ErrorBanner error={error} />
          <UnverifiedEmailBanner user={user} />

          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 sm:space-y-6"
            >
              <GameModesGallery />

              <YourPlaylists defaultOpen />

              {/* Rendered for everyone: the server answers with nothing for
                  anyone it is not for, and nothing renders nothing. */}
              <TrackGroupView
                type={TrackGroupDtoTypeEnum.Special}
                title="Special"
                defaultOpen
              />

              <CuratedGroups defaultOpen={!hasSpotify} />
            </motion.div>
          ) : null}
        </div>
      </div>

      <AppFooter />

      {/* Streak at risk overlay */}
      {!streakDismissed && (
        <StreakFreezePrompt onResolved={() => setStreakDismissed(true)} />
      )}
    </main>
  );
}
