'use client';

import { memo } from 'react';

const SOURCES = [
  { name: 'Deezer', href: 'https://www.deezer.com' },
  { name: 'Spotify', href: 'https://www.spotify.com' },
] as const;

function AppFooterComponent() {
  return (
    <footer className="p-6 text-center text-[10px] tracking-widest text-muted-foreground border-t border-fg/5 relative z-10 uppercase text-balance">
      Music from <Source {...SOURCES[0]} />. Your own playlists from{' '}
      <Source {...SOURCES[1]} />. Affiliated with neither.
    </footer>
  );
}

function Source({ name, href }: { name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 decoration-fg/20 hover:decoration-fg/60 transition-colors"
    >
      {name}
    </a>
  );
}

export const AppFooter = memo(AppFooterComponent);
