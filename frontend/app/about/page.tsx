import type { Metadata } from 'next';
import { AboutPage } from '@/components/about/AboutPage';

export const metadata: Metadata = {
  title: 'About',
  description:
    'A song guessing game: hear a tenth of a second and name the song. Where the songs come from, how to play your own playlists, and how to report a bug.',
};

export default function Page() {
  return <AboutPage />;
}
