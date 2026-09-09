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
  title: 'Sopranino - Music Guessing Game',
  description:
    'Test your music knowledge with Sopranino. Guess the song from a snippet of your favorite playlists!',
  keywords: [
    'music',
    'game',
    'spotify',
    'guessing game',
    'music quiz',
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
    title: 'Sopranino - Music Guessing Game',
    description:
      'Test your music knowledge! Guess the song from a snippet of your favorite playlists.',
    siteName: 'Sopranino',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sopranino - Music Guessing Game',
    description:
      'Test your music knowledge! Guess the song from a snippet of your favorite playlists.',
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
