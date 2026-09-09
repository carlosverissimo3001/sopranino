'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Github, Globe, Linkedin } from 'lucide-react';
import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { useMe } from '@/hooks/auth/useMe';
import { useLogout } from '@/hooks/auth/useLogout';

const linkClass =
  'underline underline-offset-4 decoration-fg/25 hover:decoration-spotify-green transition-colors';

/** The ladder the game actually uses, so the page cannot drift from it. */
const ROUND_DURATIONS = [0.1, 1, 2, 4, 7, 12];

const ELSEWHERE = [
  {
    label: 'carlosverissimo.com',
    href: 'https://carlosverissimo.com',
    Icon: Globe,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/carlosverissimo3001',
    Icon: Github,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/carlosverissimo3001/',
    Icon: Linkedin,
  },
] as const;

export default function AboutPage() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden text-fg">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(29,185,84,0.10), transparent 55%)',
          }}
        />
      </div>

      <AppHeader
        user={user}
        onLogout={() => logoutMutation.mutate()}
        isLoggingOut={logoutMutation.isPending}
      />

      <div className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-7">
        <article className="mx-auto max-w-[64ch]">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            About
          </h1>

          <p className="mt-5 text-balance text-xl leading-snug tracking-tight text-fg sm:text-2xl">
            You hear a tenth of a second of a song and try to name it. Miss, and
            you get a little more.
          </p>

          <SnippetLadder />

          <div className="mt-6 space-y-3.5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              There are four ways to play: your own playlists, one shared song a
              day, an endless speed run, and rooms where you race people you
              know. It started on Slack huddles with a friend, playing Songless
              and Bandle, until one of us said it would be better with our own
              playlists. I built it months later.
            </p>
            <p>
              <a
                href="https://www.deezer.com"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Deezer
              </a>{' '}
              supplies the songs: a curated pool of a few thousand tracks, every
              snippet you hear, the genre labels, and the country charts, which
              refresh every week.{' '}
              <a
                href="https://www.spotify.com"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Spotify
              </a>{' '}
              is what connects your own library, if you want to play against
              music you already know. You do not need either account. This
              project is affiliated with neither company.
            </p>
            <p className="text-[13px] italic leading-relaxed text-muted-foreground/70">
              Spotify only lets apps in development link five accounts, which is
              why the curated pool exists at all: so the game works for everyone
              else.
            </p>
            <p className="text-fg">
              A <em className="font-medium not-italic">sopranino</em> is the
              smallest instrument in a family, pitched above the soprano. There
              are sopranino saxophones and sopranino recorders, and they are all
              a bit smaller than you expect. It seemed right for a game that
              gives you a tenth of a second and asks you to work it out.
            </p>
            <p>
              I am Carlos Veríssimo, a software engineer based in Portugal. The
              code is public if you would rather read it than play it.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back
            </Link>

            <ul className="flex flex-wrap gap-2">
              {ELSEWHERE.map(({ label, href, Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-fg/10 px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:border-spotify-green/40 hover:text-fg"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{label}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <AppFooter />
    </main>
  );
}

/**
 * The game's own progress bar, all six rounds at once. Each segment is the
 * share of the song that round buys you, so round one is the sliver it is.
 */
function SnippetLadder() {
  const total = ROUND_DURATIONS.reduce((sum, seconds) => sum + seconds, 0);

  // Centre of each segment, so a label sits over the round it names.
  let elapsed = 0;
  const marks = ROUND_DURATIONS.map((seconds) => {
    const centre = ((elapsed + seconds / 2) / total) * 100;
    elapsed += seconds;
    return { seconds, centre };
  });

  const [first, second, ...rest] = marks;

  return (
    <figure className="mt-6 font-mono text-[11px] tabular-nums text-muted-foreground">
      {/* Round two sits above: at this scale its label would collide with 0.1s. */}
      <div className="relative h-4" aria-hidden>
        <Mark {...second} />
      </div>

      <div
        className="flex h-2.5 gap-px overflow-hidden rounded-full bg-fg/5"
        role="img"
        aria-label={`Snippet length by round: ${ROUND_DURATIONS.map(
          (seconds, i) => `round ${i + 1}, ${seconds} seconds`,
        ).join('; ')}`}
      >
        {ROUND_DURATIONS.map((seconds, i) => (
          <div
            key={seconds}
            className="h-full bg-spotify-green first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(seconds / total) * 100}%`,
              opacity: 0.3 + i * 0.14,
            }}
            aria-hidden
          />
        ))}
      </div>

      <div className="relative mt-1.5 h-4" aria-hidden>
        <span className="absolute left-0">{first.seconds}s</span>
        {rest.map((mark) => (
          <Mark key={mark.seconds} {...mark} />
        ))}
      </div>
    </figure>
  );
}

function Mark({ seconds, centre }: { seconds: number; centre: number }) {
  return (
    <span
      className="absolute -translate-x-1/2 whitespace-nowrap"
      style={{ left: `${centre}%` }}
    >
      {seconds}s
    </span>
  );
}
