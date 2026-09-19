'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GamePage } from '@/components/game/GamePage';

/**
 * What a visitor with no session lands on: a round they can play with one tap,
 * rather than a page about one. Nothing is started until that tap, since this
 * page is crawled and a page load must not mint a user.
 */
export function LandingGame({ canSignIn }: { canSignIn: boolean }) {
  return (
    <>
      <GamePage
        canSignIn={canSignIn}
        deferStart
        heading="Sopranino: guess the song from a snippet"
        headerTrailing={
          // A player with a Spotify-linked account is one tap from it here, not
          // two pages away.
          canSignIn ? (
            <a href="/api/auth/login" className="shrink-0">
              <Button
                variant="spotify"
                className="!h-9 px-4 !rounded-full text-xs font-bold"
              >
                <Image
                  src="/spotify-icon.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="mr-2 shrink-0"
                />
                Continue with Spotify
              </Button>
            </a>
          ) : (
            <Link
              href="/signin?from=landing"
              className="shrink-0 rounded-full border border-fg/15 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg/30 hover:text-fg"
            >
              Sign in
            </Link>
          )
        }
        afterReveal={
          // The round has minted a session, so the menu has someone to show.
          <Link
            href="/?menu"
            className="mt-4 block text-center text-sm font-semibold text-spotify-green hover:underline"
          >
            More ways to play
          </Link>
        }
      />
    </>
  );
}
