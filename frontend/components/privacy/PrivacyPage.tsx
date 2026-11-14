'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Info,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { useMe } from '@/hooks/auth/useMe';

/** Where privacy requests go. Forwarded to the inbox the feedback lands in. */
export const PRIVACY_EMAIL = 'hello@mail.sopranino.app';

/** Bump with any change to what is below, so a reader can tell. */
const UPDATED = '14 November 2026';

const linkClass =
  'text-fg underline underline-offset-4 decoration-fg/25 hover:decoration-spotify-green transition-colors';

const external = { target: '_blank', rel: 'noreferrer' } as const;

const SECTIONS = [
  { id: 'who', label: 'Who we are' },
  { id: 'data', label: 'Data we collect' },
  { id: 'cookies', label: 'Cookies and storage' },
  { id: 'services', label: 'Third-party services' },
  { id: 'basis', label: 'Legal basis' },
  { id: 'retention', label: 'Retention' },
  { id: 'rights', label: 'Your rights' },
  { id: 'google', label: 'Google sign-in' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const SUMMARY = [
  'Your data is used only to run the game. It is not sold or used for advertising.',
  'Cookies keep you signed in and remember this device. None are used for tracking.',
  'Page views are counted with a self-hosted copy of Umami, which sets no cookies.',
  'Email us and your account and its data are deleted.',
];

const DATA: { label: string; hint: string; items: string[] }[] = [
  {
    label: 'Account',
    hint: 'Email, password hash, name, linked accounts',
    items: [
      'Email address, if you sign up with one or sign in with Google.',
      'Password, stored only as a one-way hash.',
      'Display name and avatar, chosen by you or taken from Spotify.',
      'Your Spotify and Google account IDs, if you sign in with them.',
      'The country set on your Spotify profile, shown as a flag next to your name.',
    ],
  },
  {
    label: 'Gameplay',
    hint: 'Rounds, stats, settings, sets and rooms',
    items: [
      'Each round you play: the song, your guesses and your time.',
      'Stats and streaks calculated from those rounds.',
      'Your settings, the sets you add, and the rooms you host or join.',
      'As a guest, all of this is linked to a random ID with no name or email.',
    ],
  },
  {
    label: 'Messages',
    hint: 'Room chat and feedback',
    items: [
      'Room chat messages, deleted after six hours.',
      'Feedback and bug reports sent from the About page.',
    ],
  },
  {
    label: 'Spotify, if linked',
    hint: 'An encrypted token and cached playlists',
    items: [
      'An encrypted access token used to read your playlists and liked songs. Nothing is written to your Spotify account.',
      'Your playlists, cached for up to five hours.',
    ],
  },
];

const COOKIES = [
  {
    name: 'unpaused_session',
    purpose: 'Keeps you signed in',
    lasts: '15 days',
  },
  {
    name: 'unpaused_device',
    purpose: 'Links guest progress to this device',
    lasts: '1 year',
  },
  {
    name: 'unpaused_oauth_state',
    purpose: 'Secures a Spotify or Google sign-in',
    lasts: '10 min',
  },
  {
    name: 'site-access',
    purpose: 'Remembers the invite code for Spotify sign-in',
    lasts: '1 year',
  },
  {
    name: 'spotify-return',
    purpose: 'Lets a returning Spotify user sign in again',
    lasts: '1 year',
  },
] as const;

const SERVICES: { name: string; href: string; role: string; gets: string }[] = [
  {
    name: 'Railway',
    href: 'https://railway.com',
    role: 'Hosts the server and database, in the EU',
    gets: 'All data listed above',
  },
  {
    name: 'Vercel',
    href: 'https://vercel.com',
    role: 'Hosts the website',
    gets: 'Standard request data, such as IP address',
  },
  {
    name: 'Deezer',
    href: 'https://www.deezer.com',
    role: 'Song previews and cover art, loaded by your browser',
    gets: 'IP address',
  },
  {
    name: 'Spotify',
    href: 'https://www.spotify.com',
    role: 'Spotify sign-in and library access',
    gets: 'That you use Sopranino, if you sign in with Spotify',
  },
  {
    name: 'Google',
    href: 'https://policies.google.com/privacy',
    role: 'Google sign-in',
    gets: 'That you use Sopranino, if you sign in with Google',
  },
  {
    name: 'Resend',
    href: 'https://resend.com',
    role: 'Sends account emails, such as verification and password reset',
    gets: 'Email address and message content',
  },
  {
    name: 'Cloudinary',
    href: 'https://cloudinary.com',
    role: 'Stores uploaded avatars',
    gets: 'The uploaded image',
  },
  {
    name: 'Typesafe',
    href: 'https://typesafe.ai',
    role: 'Checks room chat messages for spam',
    gets: 'Message text only, without any user information',
  },
  {
    name: 'Umami',
    href: 'https://umami.is',
    role: 'Page view analytics, self-hosted at analytics.carlosverissimo.com',
    gets: 'Page, referrer, browser, device type and country',
  },
  {
    name: 'Flagpedia',
    href: 'https://flagpedia.net',
    role: 'Country flag images, loaded by your browser',
    gets: 'IP address',
  },
];

/**
 * The section being read: the last heading to cross a line a fifth of the way
 * down the viewport. Starts on the first, so the sidebar is never blank.
 */
function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map(({ id }) => document.getElementById(id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    elements.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function PrivacyPage() {
  const { data: user } = useMe();
  const active = useActiveSection();

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden text-fg">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
      </div>

      <AppHeader user={user} />

      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-fg/35">
              On this page
            </p>
            <ul className="mt-2 space-y-px">
              {SECTIONS.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active === id ? 'location' : undefined}
                    className={`block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                      active === id
                        ? 'bg-fg/[0.06] font-semibold text-fg'
                        : 'text-fg/50 hover:bg-fg/[0.04] hover:text-fg/80'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="mt-6 flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] text-fg/50 transition-colors hover:bg-fg/[0.04] hover:text-fg/80"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Contact
            </a>
          </nav>
        </aside>

        <article className="min-w-0 max-w-[62ch]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-spotify-green/15 text-spotify-green">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy policy
          </h1>

          <dl className="mt-4 space-y-1.5 text-[13px]">
            <Property Icon={CalendarDays} label="Last updated">
              {UPDATED}
            </Property>
            <Property Icon={Mail} label="Contact">
              <a href={`mailto:${PRIVACY_EMAIL}`} className={linkClass}>
                {PRIVACY_EMAIL}
              </a>
            </Property>
          </dl>

          <details className="group mt-6 rounded-lg border border-fg/10 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-fg/70 [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="h-3.5 w-3.5 text-fg/40 transition-transform group-open:rotate-90"
                aria-hidden
              />
              On this page
            </summary>
            <ul className="border-t border-fg/10 px-3 py-2">
              {SECTIONS.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block py-1 text-[13px] text-fg/55 hover:text-fg"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <div className="mt-6 flex gap-3 rounded-lg bg-fg/[0.04] px-4 py-3.5">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-spotify-green"
              aria-hidden
            />
            <div className="text-[14px] leading-relaxed text-fg/75">
              <p className="font-semibold text-fg">In short</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 marker:text-fg/30">
                {SUMMARY.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>

          <Section id="who" title="Who we are">
            <p>
              Sopranino is run by Carlos Veríssimo, an individual developer
              based in Portugal, who is the data controller for the data
              described here.
            </p>
          </Section>

          <Section id="data" title="Data we collect">
            <div className="space-y-1">
              {DATA.map(({ label, hint, items }) => (
                <Toggle key={label} title={label} hint={hint}>
                  <ul className="list-disc space-y-1 pl-4 marker:text-fg/30">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Toggle>
              ))}
            </div>
            <p className="mt-3">
              Your display name and avatar are visible to other players in rooms
              and on leaderboards. To appear as Anonymous on leaderboards, turn
              off{' '}
              <span className="font-semibold text-fg">
                Name on leaderboards
              </span>{' '}
              in your profile.
            </p>
          </Section>

          <Section id="cookies" title="Cookies and storage">
            <p>
              We only use cookies that are necessary for the site to work, so no
              consent banner is shown. None are used for advertising or
              cross-site tracking.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-fg/10">
              <table className="w-full table-fixed text-left text-[13px]">
                <thead className="border-b border-fg/10 text-[12px] text-fg/45">
                  <tr>
                    <th scope="col" className="w-[44%] px-3 py-2 font-medium">
                      Cookie
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Purpose
                    </th>
                    <th scope="col" className="w-20 px-3 py-2 font-medium">
                      Lasts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fg/[0.06]">
                  {COOKIES.map(({ name, purpose, lasts }) => (
                    <tr key={name} className="align-top">
                      <td className="break-all px-3 py-2">
                        <code className="rounded bg-fg/[0.06] px-1 py-0.5 font-mono text-[12px] text-fg/80">
                          {name}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-fg/65">{purpose}</td>
                      <td className="px-3 py-2 text-fg/45">{lasts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Your browser also stores, on your device only, the email address
              you last signed in with and when you last dismissed the sign-up
              prompt. Clearing your site data removes both.
            </p>
          </Section>

          <Section id="services" title="Third-party services">
            <p>These services process data on our behalf.</p>
            <div className="mt-3">
              <Toggle
                title={`${SERVICES.length} services`}
                hint={SERVICES.map((service) => service.name).join(', ')}
              >
                <ul className="divide-y divide-fg/[0.06]">
                  {SERVICES.map(({ name, href, role, gets }) => (
                    <li key={name} className="py-2.5 first:pt-0 last:pb-0">
                      <a
                        href={href}
                        {...external}
                        className="inline-flex items-center gap-1 font-semibold text-fg transition-colors hover:text-spotify-green"
                      >
                        {name}
                        <ArrowUpRight
                          className="h-3 w-3 text-fg/30"
                          aria-hidden
                        />
                      </a>
                      <p className="text-fg/65">{role}</p>
                      <p className="text-[13px] text-fg/40">Data: {gets}</p>
                    </li>
                  ))}
                </ul>
              </Toggle>
            </div>
            <p className="mt-3">
              Song information is also looked up from Deezer, Last.fm and the
              Apple iTunes catalogue. These requests contain no personal data.
            </p>
          </Section>

          <Section id="basis" title="Legal basis">
            <p>
              <span className="font-semibold text-fg">Contract:</span> to
              provide your account and the game, including saving progress,
              running sets and rooms, and sending account emails.
            </p>
            <p className="mt-2">
              <span className="font-semibold text-fg">
                Legitimate interest:
              </span>{' '}
              to keep the service working and safe, through spam checks on chat,
              cookieless analytics and handling bug reports.
            </p>
          </Section>

          <Section id="retention" title="Retention">
            <p>
              Account and gameplay data is kept while your account exists.
              Sign-in sessions expire after 15 days. Chat messages are deleted
              after six hours. Links in account emails expire after one hour
              (password reset) or one day (email verification). When you ask for
              your account to be deleted, its data is deleted with it.
            </p>
          </Section>

          <Section id="rights" title="Your rights">
            <p>
              Under the GDPR, you can request access to your data, correction,
              deletion, a portable copy, or object to its processing. Email{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className={linkClass}>
                {PRIVACY_EMAIL}
              </a>{' '}
              from the address on your account, or tell us which account is
              yours if it has no email. We reply within one month.
            </p>
            <p className="mt-2">
              You can also lodge a complaint with the Portuguese data protection
              authority,{' '}
              <a href="https://www.cnpd.pt" {...external} className={linkClass}>
                CNPD
              </a>
              , or the authority in your country.
            </p>
          </Section>

          <Section id="google" title="Google sign-in">
            <p>
              Google sign-in requests only your email address and Google account
              ID. We do not request your name, photo, contacts, files or
              calendar. This data is used only to sign you in and to match an
              existing account with the same email. It is not shared, sold or
              used for advertising. Our use of data from Google APIs follows the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                {...external}
                className={linkClass}
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </Section>

          <Link
            href="/"
            className="mt-12 inline-flex items-center gap-1.5 text-[13px] text-fg/45 transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to Sopranino
          </Link>
        </article>
      </div>

      <AppFooter />
    </main>
  );
}

/** A Notion-style page property: icon, grey label, value. */
function Property({
  Icon,
  label,
  children,
}: {
  Icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <dt className="flex w-28 shrink-0 items-center gap-2 text-fg/40">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="min-w-0 truncate text-fg/75">{children}</dd>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: SectionId;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // Clears the sticky header when a contents link scrolls here.
    <section id={id} className="mt-9 scroll-mt-24">
      <h2 className="group flex items-center gap-2 text-xl font-semibold tracking-tight text-fg">
        {title}
        <a
          href={`#${id}`}
          aria-label={`Link to ${title}`}
          className="text-fg/20 opacity-0 transition-opacity hover:text-spotify-green group-hover:opacity-100"
        >
          #
        </a>
      </h2>
      <div className="mt-2 text-[15px] leading-relaxed text-fg/65">
        {children}
      </div>
    </section>
  );
}

/** A Notion toggle block: a one-line summary that opens onto the detail. */
function Toggle({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-md">
      <summary className="flex cursor-pointer list-none items-start gap-2 rounded-md px-1.5 py-1.5 -mx-1.5 transition-colors hover:bg-fg/[0.04] [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="mt-[5px] h-3.5 w-3.5 shrink-0 text-fg/40 transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span className="min-w-0">
          <span className="font-semibold text-fg">{title}</span>
          <span className="text-fg/40"> · {hint}</span>
        </span>
      </summary>
      <div className="pb-2 pl-6 pt-1 text-[14px]">{children}</div>
    </details>
  );
}
