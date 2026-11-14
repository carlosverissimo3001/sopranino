'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  ChartNoAxesColumn,
  Cookie,
  Mail,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { useMe } from '@/hooks/auth/useMe';

/** Where privacy requests go. Forwarded to the inbox the feedback lands in. */
export const PRIVACY_EMAIL = 'hello@mail.sopranino.app';

/** Bump with any change to what is below, so a reader can tell. */
const UPDATED = '14 November 2026';

const linkClass =
  'underline underline-offset-4 decoration-fg/25 hover:decoration-spotify-green transition-colors';

const external = { target: '_blank', rel: 'noreferrer' } as const;

const SUMMARY = [
  {
    Icon: ShieldCheck,
    title: 'No ads or data sales',
    body: 'Your data is used only to run the game. It is not sold or used for advertising.',
  },
  {
    Icon: Cookie,
    title: 'Essential cookies only',
    body: 'Cookies keep you signed in and remember this device. None are used for tracking.',
  },
  {
    Icon: ChartNoAxesColumn,
    title: 'Cookieless analytics',
    body: 'Page views are counted with a self-hosted copy of Umami, which sets no cookies.',
  },
  {
    Icon: Trash2,
    title: 'Deletion on request',
    body: 'Email us and your account and its data are deleted.',
  },
] as const;

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

const DATA: { label: string; items: string[] }[] = [
  {
    label: 'Account',
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
    items: [
      'Each round you play: the song, your guesses and your time.',
      'Stats and streaks calculated from those rounds.',
      'Your settings, the sets you add, and the rooms you host or join.',
      'As a guest, all of this is linked to a random ID with no name or email.',
    ],
  },
  {
    label: 'Messages',
    items: [
      'Room chat messages, deleted after six hours.',
      'Feedback and bug reports sent from the About page.',
    ],
  },
  {
    label: 'Spotify, if linked',
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
    lasts: '10 minutes',
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

export function PrivacyPage() {
  const { data: user } = useMe();

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
        <article className="mx-auto w-full min-w-0 max-w-[64ch]">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            Privacy policy
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground/70">
            Last updated {UPDATED}
          </p>

          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            This policy explains what personal data Sopranino collects, why, who
            it is shared with, and how to access or delete it.
          </p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {SUMMARY.map(({ Icon, title, body }) => (
              <li
                key={title}
                className="rounded-2xl border border-fg/10 bg-fg/[0.03] p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-spotify-green/15 text-spotify-green">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold text-fg">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ul>

          <nav
            aria-label="On this page"
            className="mt-8 border-y border-fg/10 py-4"
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-fg/40">
              On this page
            </p>
            <ol className="mt-2.5 grid gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-2">
              {SECTIONS.map(({ id, label }, i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="group flex items-baseline gap-2.5 text-muted-foreground transition-colors hover:text-fg"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-fg/30 group-hover:text-spotify-green">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Section n={1} id="who" title="Who we are">
            <p>
              Sopranino is run by Carlos Veríssimo, an individual developer
              based in Portugal, who is the data controller for the data
              described here. Contact:{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className={linkClass}>
                {PRIVACY_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section n={2} id="data" title="Data we collect">
            <div className="space-y-5">
              {DATA.map(({ label, items }) => (
                <div key={label}>
                  <h3 className="text-[13px] font-black uppercase tracking-wider text-fg/70">
                    {label}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <span
                          className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-spotify-green"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3 text-[14px]">
                Your display name and avatar are visible to other players in
                rooms and on leaderboards. To appear as Anonymous on
                leaderboards, turn off{' '}
                <span className="font-semibold text-fg">
                  Name on leaderboards
                </span>{' '}
                in your profile.
              </p>
            </div>
          </Section>

          <Section n={3} id="cookies" title="Cookies and browser storage">
            <p>
              We only use cookies that are necessary for the site to work, so no
              consent banner is shown. None are used for advertising or
              cross-site tracking.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-fg/10">
              <table className="w-full table-fixed text-left text-[13px]">
                <thead className="bg-fg/[0.04] text-[11px] uppercase tracking-wider text-fg/45">
                  <tr>
                    <th scope="col" className="w-[42%] px-3 py-2 font-black">
                      Cookie
                    </th>
                    <th scope="col" className="px-3 py-2 font-black">
                      Purpose
                    </th>
                    <th
                      scope="col"
                      className="hidden w-24 px-3 py-2 font-black sm:table-cell"
                    >
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fg/10">
                  {COOKIES.map(({ name, purpose, lasts }) => (
                    <tr key={name} className="align-top">
                      <td className="break-all px-3 py-2.5 font-mono text-[12px] text-fg/80">
                        {name}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {purpose}
                        <span className="mt-0.5 block text-fg/40 sm:hidden">
                          {lasts}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 text-fg/50 sm:table-cell">
                        {lasts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Your browser also stores, on your device only, the email address
              you last signed in with and when you last dismissed the sign-up
              prompt. Clearing your site data removes both.
            </p>
          </Section>

          <Section n={4} id="services" title="Third-party services">
            <p>These services process data on our behalf:</p>
            <ul className="mt-4 divide-y divide-fg/10 border-y border-fg/10">
              {SERVICES.map(({ name, href, role, gets }) => (
                <li
                  key={name}
                  className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4"
                >
                  <a
                    href={href}
                    {...external}
                    className="inline-flex items-center gap-1 self-start text-[14px] font-bold text-fg transition-colors hover:text-spotify-green"
                  >
                    {name}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-fg/30"
                      aria-hidden
                    />
                  </a>
                  <div className="min-w-0 text-[14px]">
                    <p className="text-fg/80">{role}</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground/80">
                      Data: {gets}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Song information is also looked up from Deezer, Last.fm and the
              Apple iTunes catalogue. These requests contain no personal data.
            </p>
          </Section>

          <Section n={5} id="basis" title="Legal basis">
            <ul className="space-y-2">
              <li>
                <span className="font-semibold text-fg">Contract.</span> To
                provide your account and the game: saving your progress, running
                sets and rooms, and sending account emails.
              </li>
              <li>
                <span className="font-semibold text-fg">
                  Legitimate interest.
                </span>{' '}
                To keep the service working and safe: spam checks on chat,
                cookieless analytics, and handling bug reports.
              </li>
            </ul>
          </Section>

          <Section n={6} id="retention" title="Retention">
            <p>
              Account and gameplay data is kept while your account exists.
              Sign-in sessions expire after 15 days. Chat messages are deleted
              after six hours. Links in account emails expire after one hour
              (password reset) or one day (email verification). When you ask for
              your account to be deleted, its data is deleted with it.
            </p>
          </Section>

          <Section n={7} id="rights" title="Your rights">
            <p>
              Under the GDPR, you can request access to your data, correction,
              deletion, a portable copy, or object to its processing. Email{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className={linkClass}>
                {PRIVACY_EMAIL}
              </a>{' '}
              from the address on your account, or tell us which account is
              yours if it has no email. We reply within one month.
            </p>
            <p className="mt-3">
              You can also lodge a complaint with the Portuguese data protection
              authority,{' '}
              <a href="https://www.cnpd.pt" {...external} className={linkClass}>
                CNPD
              </a>
              , or the authority in your country.
            </p>
          </Section>

          <Section n={8} id="google" title="Google sign-in">
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

          <aside className="mt-10 flex flex-col gap-4 rounded-2xl border border-spotify-green/25 bg-spotify-green/[0.06] p-5 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-spotify-green/15 text-spotify-green">
              <Mail className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black tracking-tight text-fg">
                Questions or requests
              </p>
              <p className="mt-0.5 break-words text-[13px] leading-relaxed text-muted-foreground">
                Contact {PRIVACY_EMAIL}. If this policy changes, the date at the
                top is updated.
              </p>
            </div>
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-spotify-green px-5 text-sm font-bold text-black transition-colors hover:bg-spotify-green/90"
            >
              Email us
            </a>
          </aside>

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

function Section({
  n,
  id,
  title,
  children,
}: {
  n: number;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // Clears the sticky header when a contents link scrolls here.
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="flex items-baseline gap-3 text-lg font-black tracking-tight text-fg">
        <span className="font-mono text-[12px] font-normal tabular-nums text-spotify-green">
          {String(n).padStart(2, '0')}
        </span>
        {title}
      </h2>
      <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
