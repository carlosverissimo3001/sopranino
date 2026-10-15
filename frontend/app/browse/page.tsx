import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BrowsePage } from '@/components/features/browse/BrowsePage';

export const metadata: Metadata = {
  title: 'Browse',
  description:
    'Everything you can play: your playlists and imports, and sets by artist, decade, genre and the weekly country charts.',
};

export default function Page() {
  return (
    <Suspense>
      <BrowsePage />
    </Suspense>
  );
}
