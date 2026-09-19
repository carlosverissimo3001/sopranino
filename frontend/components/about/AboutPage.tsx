'use client';

import { useId, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Github,
  Globe,
  Linkedin,
} from 'lucide-react';
import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { useMe } from '@/hooks/auth/useMe';
import { FeedbackForm } from '@/components/about/FeedbackForm';

const linkClass =
  'underline underline-offset-4 decoration-fg/25 hover:decoration-spotify-green transition-colors';

/** The ladder the game actually uses, so the page cannot drift from it. */
const ROUND_DURATIONS = [0.1, 1, 2, 4, 7, 12];

const REPO_URL = 'https://github.com/carlosverissimo3001/sopranino';

const ELSEWHERE = [
  {
    label: 'Website',
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

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'faq', label: 'FAQ' },
  { id: 'feedback', label: 'Feedback' },
] as const;

type Section = (typeof SECTIONS)[number]['id'];

const isSection = (value: string): value is Section =>
  SECTIONS.some((section) => section.id === value);

const external = { target: '_blank', rel: 'noreferrer' } as const;

const FAQ: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'Where do the songs come from?',
    answer: (
      <>
        <a href="https://www.deezer.com" {...external} className={linkClass}>
          Deezer
        </a>{' '}
        supplies them: a curated pool of a few thousand tracks, every snippet
        you hear, the genre labels, and the country charts, which refresh every
        week.
      </>
    ),
  },
  {
    question: 'Do I need a Spotify or Deezer account?',
    answer:
      'No, neither is needed to play. Linking Spotify brings your own library in, but it is invite-only for now: Spotify lets an app like this link five accounts. Anyone can play their own playlists through Deezer instead.',
  },
  {
    question: 'How do I play my own playlists?',
    answer:
      'Paste a link to a public Deezer playlist, and its songs become a set only you can see. From any other service, copy the playlist to Deezer first with a free tool; the app walks you through it.',
  },
  {
    question: 'Why can only a few people link Spotify?',
    answer:
      'Spotify lets an app in development link five accounts, and reading a playlist from a link needs a quota a project like this cannot get. It is also why the curated pool exists at all.',
  },
  {
    question: 'What does "sopranino" mean?',
    answer:
      'The smallest instrument in a family, pitched above the soprano. There are sopranino saxophones and recorders, all a bit smaller than you expect. It fits a game that gives you a tenth of a second.',
  },
  {
    question: 'Is the code public?',
    answer: (
      <>
        Yes,{' '}
        <a href={REPO_URL} {...external} className={linkClass}>
          on GitHub
        </a>
        , if you would rather read it than play it.
      </>
    ),
  },
];

export function AboutPage() {
  const { data: user } = useMe();
  const indicatorId = useId();
  const [section, setSection] = useState<Section>('about');

  // The hash picks the section, so "Report a bug" can keep linking to
  // /about#feedback. Read before paint, or the page would show About first.
  useLayoutEffect(() => {
    const read = () => {
      const hash = window.location.hash.slice(1);
      if (isSection(hash)) setSection(hash);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const open = (next: Section) => {
    setSection(next);
    // A replace, keeping ?from= for the report form.
    const { pathname, search } = window.location;
    window.history.replaceState(
      null,
      '',
      next === 'about'
        ? `${pathname}${search}`
        : `${pathname}${search}#${next}`,
    );
  };

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

      <AppHeader user={user} />

      <div className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-7">
        <article className="mx-auto max-w-[64ch]">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            About
          </h1>

          <div
            role="tablist"
            aria-label="About this game"
            className="mt-5 inline-flex h-9 items-center gap-0.5 rounded-full border border-fg/10 bg-fg/[0.03] p-0.5"
          >
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={section === id}
                aria-controls={`panel-${id}`}
                onClick={() => open(id)}
                className={`relative h-full rounded-full px-4 text-xs font-black uppercase tracking-wider transition-colors ${
                  section === id ? 'text-bg' : 'text-fg/40 hover:text-fg/70'
                }`}
              >
                {section === id && (
                  <motion.span
                    layoutId={indicatorId}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    className="absolute inset-0 rounded-full bg-fg"
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          {/* All three are in the HTML, hidden rather than unmounted, so search
              reads the FAQ and the form keeps what was typed across a switch. */}
          <section
            id="panel-about"
            role="tabpanel"
            aria-labelledby="tab-about"
            hidden={section !== 'about'}
            className="mt-5"
          >
            <p className="text-balance text-xl leading-snug tracking-tight text-fg sm:text-2xl">
              You hear a tenth of a second of a song and try to name it. Miss,
              and you get a little more.
            </p>

            <SnippetLadder />

            <div className="mt-5 space-y-2 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Play the pool, your own playlists, one shared song a day, an
                endless speed run, or a room with people you know.
              </p>
              <p>
                It started on Slack huddles with a friend, playing Songless and
                Bandle, until one of us said it would be better with our own
                playlists.
              </p>
              <p className="text-[13px] text-muted-foreground/70">
                Songs via Deezer, libraries via Spotify. Not affiliated with
                either.
              </p>
            </div>

            <p className="mt-5 text-[15px] text-fg">
              Made by Carlos Veríssimo, in Portugal.
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {ELSEWHERE.map(({ label, href, Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...external}
                    className="flex items-center gap-1.5 rounded-lg border border-fg/10 px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-spotify-green/40 hover:text-fg"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{label}</span>
                    <ArrowUpRight
                      className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:block"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="panel-faq"
            role="tabpanel"
            aria-labelledby="tab-faq"
            hidden={section !== 'faq'}
            className="mt-6 divide-y divide-fg/10 border-y border-fg/10"
          >
            {FAQ.map(({ question, answer }) => (
              <details key={question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-fg [&::-webkit-details-marker]:hidden">
                  {question}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-fg/40 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 text-[15px] leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </section>

          <section
            id="panel-feedback"
            role="tabpanel"
            aria-labelledby="tab-feedback"
            hidden={section !== 'feedback'}
            className="mt-6"
          >
            <p className="text-[15px] text-muted-foreground">
              A bug, a round that will not load, or an idea. It goes straight to
              me.
            </p>
            <div className="mt-4">
              <FeedbackForm />
            </div>
          </section>

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-1.5 text-[13px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back
          </Link>
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

  const [first, second, third, ...rest] = marks;

  return (
    <figure className="mt-5 font-mono text-[11px] tabular-nums text-muted-foreground">
      {/* Rounds two and three sit above: at this scale, and on a phone, their
          labels would collide with 0.1s. */}
      <div className="relative h-4" aria-hidden>
        <Mark {...second} />
        <Mark {...third} />
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
