'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  ChevronDown,
  Disc3,
  Shuffle,
  Timer,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShuffleGamePage } from '@/components/game/ShuffleGamePage';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { TrackGroupDtoTypeEnum } from '@/sdk';

const PILL =
  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors';
const PILL_IDLE = 'border-fg/10 text-fg/60 hover:border-fg/25 hover:text-fg';

const LINKED_MODES = [
  { href: '/daily', icon: Calendar, label: 'Daily song' },
  { href: '/speed-run', icon: Timer, label: 'Speed run' },
  { href: '/multiplayer/join', icon: Users, label: 'With friends' },
];

/** Decades and genres, listed where they are picked rather than behind a guess at one. */
function SetList() {
  const { data: decades = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres = [] } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);

  return (
    <div className="flex max-w-md flex-wrap justify-center gap-1.5">
      {[...decades, ...genres].map((group) => (
        <Link
          key={group.id}
          href={`/group/${group.slug}`}
          className="rounded-full bg-fg/5 px-2.5 py-1 text-[11px] font-semibold text-fg/70 transition-colors hover:bg-fg/10 hover:text-fg"
        >
          {group.name}
        </Link>
      ))}
    </div>
  );
}

function ModeNav() {
  const [setsOpen, setSetsOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Game modes"
        className="flex flex-wrap justify-center gap-1.5"
      >
        <span
          aria-current="page"
          className={`${PILL} border-spotify-green/30 bg-spotify-green/15 text-spotify-green`}
        >
          <Shuffle className="hidden h-3.5 w-3.5 sm:block" />
          Shuffle
        </span>
        <button
          type="button"
          aria-expanded={setsOpen}
          onClick={() => setSetsOpen((open) => !open)}
          className={`${PILL} ${PILL_IDLE}`}
        >
          <Disc3 className="hidden h-3.5 w-3.5 sm:block" />
          Decades &amp; genres
          <ChevronDown
            className={`h-3 w-3 transition-transform ${setsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {LINKED_MODES.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`${PILL} ${PILL_IDLE}`}>
            <Icon className="hidden h-3.5 w-3.5 sm:block" />
            {label}
          </Link>
        ))}
      </nav>
      {setsOpen && <SetList />}
    </>
  );
}

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
        renderTitle={({ currentRound, maxRounds, isOver }) => (
          <div className="mb-3 flex flex-col items-center gap-2 sm:mb-4">
            {/* For crawlers and screen readers; the round says the rest. */}
            <h1 className="sr-only">
              Sopranino: guess the song from a snippet
            </h1>
            <ModeNav />
            {!isOver && (
              <p className="text-sm font-medium text-fg/50">
                Round {Math.min(currentRound + 1, maxRounds)} of {maxRounds}
              </p>
            )}
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
