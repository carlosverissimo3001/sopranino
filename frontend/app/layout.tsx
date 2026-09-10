import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SITE_URL } from '@/lib/site-url';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  // Otherwise the OG image resolves against VERCEL_URL, the per deploy host.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title: 'Sopranino - Guess the Song from a Snippet',
  description:
    'A music guessing game. Hear a tenth of a second, name the track, six tries. Play your own Spotify playlists or a curated pool. No account needed.',
  keywords: [
    'guess the song',
    'song guessing game',
    'music guessing game',
    'music quiz',
    'name that tune',
    'sopranino',
  ],
  authors: [{ name: 'Sopranino' }],
  creator: 'Sopranino',
  publisher: 'Sopranino',
  applicationName: 'Sopranino',
  appleWebApp: {
    capable: true,
    title: 'Sopranino',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Sopranino - Guess the Song from a Snippet',
    description:
      'Hear a tenth of a second of a song and name it. Six tries. No account needed.',
    siteName: 'Sopranino',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sopranino - Guess the Song from a Snippet',
    description:
      'Hear a tenth of a second of a song and name it. Six tries. No account needed.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} font-sans antialiased max-w-[100vw] overflow-x-hidden`}
      >
        <ThemeProvider>
          <ErrorBoundary>
            <MotionProvider>
              <QueryProvider>{children}</QueryProvider>
            </MotionProvider>
          </ErrorBoundary>
          <OfflineBanner />
          <Toaster theme="dark" position="bottom-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
