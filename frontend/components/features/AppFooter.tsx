'use client';

import { memo } from 'react';
import Link from 'next/link';

const DEEZER = 'https://www.deezer.com';
const SPOTIFY = 'https://www.spotify.com';
const AUTHOR = 'https://carlosverissimo.com';
const SOURCE = 'https://github.com/carlosverissimo3001/sopranino';

function AppFooterComponent() {
  return (
    <footer className="p-6 text-center text-[10px] tracking-widest text-muted-foreground border-t border-fg/5 relative z-10 uppercase text-balance">
      <p>
        Music from <External href={DEEZER}>Deezer</External>. Your own playlists
        from <External href={SPOTIFY}>Spotify</External>. Affiliated with
        neither.
      </p>
      <p className="mt-1.5">
        Built by <External href={AUTHOR}>Carlos Veríssimo</External>.{' '}
        <Link href="/about" className={linkClass}>
          About this project
        </Link>
        . <External href={SOURCE}>Source on GitHub</External>.
      </p>
    </footer>
  );
}

const linkClass =
  'underline underline-offset-2 decoration-fg/20 hover:decoration-fg/60 transition-colors';

function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

export const AppFooter = memo(AppFooterComponent);
