'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShuffleGamePage } from '@/components/game/ShuffleGamePage';

/**
 * What a visitor with no session lands on: a round they can play with one tap,
 * rather than a page about one. Nothing is started until that tap, since this
 * page is crawled and a page load must not mint a user.
 */
export function LandingGame({ canSignIn }: { canSignIn: boolean }) {
  return (
    <>
      <ShuffleGamePage
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
              href="/signin"
              className="shrink-0 rounded-full border border-fg/15 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg/30 hover:text-fg"
            >
              Sign in
            </Link>
          )
        }
        afterReveal={
          // A full load: the session now exists, so the home page shows every
          // mode rather than this.
          <a
            href="/"
            className="mt-4 block text-center text-sm font-semibold text-spotify-green hover:underline"
          >
            More ways to play
          </a>
        }
      />
      {/* Below the round on purpose: what a search engine reads, not what a
          player has to scroll past to play. */}
      <section className="mx-auto max-w-2xl px-4 pb-10 text-sm leading-relaxed text-fg/50 sm:px-6">
        <h2 className="mb-2 font-bold text-fg/70">How it works</h2>
        <p>
          Press play and hear a tenth of a second of a song. Name it, or skip to
          hear a little more: every miss unlocks a longer snippet and a hint,
          with six tries to get it. Pick how well-known the songs are, from Easy
          hits to Impossible deep cuts.
        </p>
        <p className="mt-2">
          There is a new daily song every day, curated sets for every decade and
          genre, a speed run with a leaderboard, and rooms to play the same
          songs with friends. No account needed.
        </p>
      </section>
    </>
  );
}
