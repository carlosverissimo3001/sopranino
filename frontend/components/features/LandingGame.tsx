'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Disc3, Shuffle, Timer, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShuffleGamePage } from '@/components/game/ShuffleGamePage';

const OTHER_MODES = [
  { href: '/daily', icon: Calendar, label: 'Daily song' },
  { href: '/group/1990s', icon: Disc3, label: 'Decades' },
  { href: '/speed-run', icon: Timer, label: 'Speed run' },
  { href: '/multiplayer/join', icon: Users, label: 'With friends' },
];

/**
 * What a visitor with no session lands on: a round they can play with one tap,
 * rather than a page about one. Nothing is started until that tap, since this
 * page is crawled and a page load must not mint a user.
 */
export function LandingGame({ canSignIn }: { canSignIn: boolean }) {
  return (
    <ShuffleGamePage
      canSignIn={canSignIn}
      deferStart
      renderTitle={({ currentRound, maxRounds }) => (
        <div className="mb-3 flex flex-col items-center gap-2 sm:mb-4">
          {/* For crawlers and screen readers; the round says the rest. */}
          <h1 className="sr-only">Sopranino: guess the song from a snippet</h1>
          <nav
            aria-label="Game modes"
            className="flex max-w-full gap-1.5 overflow-x-auto pb-1"
          >
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-spotify-green/15 px-3 py-1.5 text-xs font-bold text-spotify-green">
              <Shuffle className="h-3.5 w-3.5" />
              Shuffle
            </span>
            {OTHER_MODES.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-fg/10 px-3 py-1.5 text-xs font-semibold text-fg/60 transition-colors hover:border-fg/25 hover:text-fg"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-sm font-medium text-fg/50">
            Round {Math.min(currentRound + 1, maxRounds)} of {maxRounds}
          </p>
        </div>
      )}
      headerLeading={
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg bg-spotify-green p-1.5">
            <Zap className="h-4 w-4 fill-black text-black" />
          </span>
          <span className="text-sm font-black uppercase italic tracking-tighter sm:text-base">
            Sopranino
          </span>
        </Link>
      }
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
  );
}
